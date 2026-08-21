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

app.listen(PORT, () => {
  console.log(`🚀 ครัวลุงหนุ่ย Node.js API Server running on port ${PORT}`);
});
