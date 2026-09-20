/**
 * Restaurant POS Backend Server (Node.js Express)
 * ครัวลุงหนุ่ย (Krua Lung Nui) - Zero Cost REST API Server
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DB_FILE = path.join(__dirname, 'db', 'database.json');

app.use(cors());
app.use(express.json());

// Helper to read database
function readDB() {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  }
  return { settings: {}, categories: [], menus: [], tables: [], orders: [] };
}

// Helper to write database
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Root status
app.get('/', (req, res) => {
  const db = readDB();
  res.json({
    status: 'online',
    shop: db.settings?.shopName || 'ครัวลุงหนุ่ย (Krua Lung Nui)',
    version: '1.0.0',
    endpoints: ['/api/menus', '/api/categories', '/api/tables', '/api/orders', '/api/settings']
  });
});

// Menus API
app.get('/api/menus', (req, res) => {
  const db = readDB();
  res.json(db.menus || []);
});

// Categories API
app.get('/api/categories', (req, res) => {
  const db = readDB();
  res.json(db.categories || []);
});

// Tables API
app.get('/api/tables', (req, res) => {
  const db = readDB();
  res.json(db.tables || []);
});

// Orders API (Get all orders)
app.get('/api/orders', (req, res) => {
  const db = readDB();
  res.json(db.orders || []);
});

// Create new order (From customer QR code)
app.post('/api/orders', (req, res) => {
  const db = readDB();
  const newOrder = {
    id: req.body.id || `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
    tableId: req.body.tableId || 't-1',
    tableName: req.body.tableName || '1',
    createdAt: new Date().toISOString(),
    status: 'pending',
    paymentStatus: 'unpaid',
    paymentMethod: req.body.paymentMethod || 'promptpay',
    items: req.body.items || [],
    subtotal: req.body.subtotal || 0,
    total: req.body.total || 0
  };

  // Update table status
  const table = db.tables?.find(t => t.name === String(newOrder.tableName) || t.id === newOrder.tableId);
  if (table) table.status = 'occupied';

  db.orders = db.orders || [];
  db.orders.unshift(newOrder);
  writeDB(db);

  res.status(201).json({ success: true, order: newOrder });
});

// Settle and Close Table Checkout
app.post('/api/checkout', (req, res) => {
  const { tableId } = req.body;
  if (!tableId) return res.status(400).json({ error: 'Missing tableId' });

  const db = readDB();
  db.orders?.forEach(o => {
    if (o.tableId === tableId && o.paymentStatus === 'unpaid') {
      o.paymentStatus = 'paid';
      o.status = 'completed';
    }
  });

  const table = db.tables?.find(t => t.id === tableId);
  if (table) table.status = 'available';

  writeDB(db);
  res.json({ success: true, message: 'Table checked out successfully' });
});

// Settings API
app.get('/api/settings', (req, res) => {
  const db = readDB();
  res.json(db.settings || {});
});

app.post('/api/settings', (req, res) => {
  const db = readDB();
  db.settings = req.body;
  writeDB(db);
  res.json({ success: true, settings: db.settings });
});

// Accounting: Transactions API
app.get('/api/accounting/transactions', (req, res) => {
  const db = readDB();
  res.json(db.transactions || []);
});

app.post('/api/accounting/transactions', (req, res) => {
  const db = readDB();
  db.transactions = db.transactions || [];
  const txn = req.body;
  
  // If loan payment, adjust loan balance
  if (txn.type === 'EXPENSE' && txn.category === 'loan_payment' && txn.loanId) {
    const loan = db.loans?.find(l => l.id === txn.loanId);
    if (loan) {
      loan.balanceRemaining = Math.max(0, (loan.balanceRemaining || 0) - Number(txn.amount || 0));
      loan.termsPaid = (loan.termsPaid || 0) + 1;
      if (loan.balanceRemaining <= 0) loan.status = 'completed';
    }
  }

  const existingIdx = db.transactions.findIndex(t => t.id === txn.id);
  if (existingIdx >= 0) {
    db.transactions[existingIdx] = txn;
  } else {
    db.transactions.unshift(txn);
  }
  writeDB(db);
  res.status(201).json({ success: true, transaction: txn });
});

app.delete('/api/accounting/transactions/:id', (req, res) => {
  const db = readDB();
  const txnId = req.params.id;
  const txn = db.transactions?.find(t => t.id === txnId);
  if (txn && txn.category === 'loan_payment' && txn.loanId) {
    const loan = db.loans?.find(l => l.id === txn.loanId);
    if (loan) {
      loan.balanceRemaining = Number(loan.balanceRemaining || 0) + Number(txn.amount || 0);
      loan.termsPaid = Math.max(0, (loan.termsPaid || 1) - 1);
      if (loan.balanceRemaining > 0 && loan.status === 'completed') loan.status = 'active';
    }
  }
  db.transactions = (db.transactions || []).filter(t => t.id !== txnId);
  writeDB(db);
  res.json({ success: true, message: 'Transaction deleted' });
});

// Accounting: Loans API
app.get('/api/accounting/loans', (req, res) => {
  const db = readDB();
  res.json(db.loans || []);
});

app.post('/api/accounting/loans', (req, res) => {
  const db = readDB();
  db.loans = db.loans || [];
  const loan = req.body;
  const existingIdx = db.loans.findIndex(l => l.id === loan.id);
  if (existingIdx >= 0) {
    db.loans[existingIdx] = loan;
  } else {
    db.loans.push(loan);
  }
  writeDB(db);
  res.status(201).json({ success: true, loan });
});

// Accounting: Daily Records API
app.get('/api/accounting/daily-records', (req, res) => {
  const db = readDB();
  res.json(db.daily_records || []);
});

app.post('/api/accounting/daily-records', (req, res) => {
  const db = readDB();
  db.daily_records = db.daily_records || [];
  const rec = req.body;
  const existingIdx = db.daily_records.findIndex(r => r.id === rec.id || r.recordDate === rec.recordDate);
  if (existingIdx >= 0) {
    db.daily_records[existingIdx] = rec;
  } else {
    db.daily_records.unshift(rec);
  }
  writeDB(db);
  res.status(201).json({ success: true, record: rec });
});

app.listen(PORT, () => {
  console.log(`🚀 ครัวลุงหนุ่ย Node.js API Server running on port ${PORT}`);
});
