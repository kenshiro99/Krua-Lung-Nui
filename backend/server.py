#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Restaurant POS Backend Server (Zero-Cost Architecture)
ครัวลุงหนุ่ย (Krua Lung Nui) - Python REST API Server
"""

import os
import json
import http.server
import socketserver
from urllib.parse import urlparse, parse_qs
from datetime import datetime

PORT = 5000
DB_FILE = os.path.join(os.path.dirname(__file__), 'db', 'database.json')

def load_db():
    if os.path.exists(DB_FILE):
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"settings": {}, "categories": [], "menus": [], "tables": [], "orders": []}

def save_db(data):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

class POSAPIHandler(http.server.BaseHTTPRequestHandler):
    def _set_headers(self, status_code=200, content_type='application/json'):
        self.send_response(status_code)
        self.send_header('Content-type', f'{content_type}; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers(200)

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        db = load_db()

        if path == '/' or path == '/api/status':
            self._set_headers(200)
            res = {
                "status": "online",
                "shop": db.get("settings", {}).get("shopName", "ครัวลุงหนุ่ย"),
                "timestamp": datetime.now().isoformat(),
                "endpoints": [
                    "/api/menus",
                    "/api/categories",
                    "/api/tables",
                    "/api/orders",
                    "/api/settings"
                ]
            }
            self.wfile.write(json.dumps(res, ensure_ascii=False).encode('utf-8'))

        elif path == '/api/menus':
            self._set_headers(200)
            self.wfile.write(json.dumps(db.get("menus", []), ensure_ascii=False).encode('utf-8'))

        elif path == '/api/categories':
            self._set_headers(200)
            self.wfile.write(json.dumps(db.get("categories", []), ensure_ascii=False).encode('utf-8'))

        elif path == '/api/tables':
            self._set_headers(200)
            self.wfile.write(json.dumps(db.get("tables", []), ensure_ascii=False).encode('utf-8'))

        elif path == '/api/orders':
            self._set_headers(200)
            self.wfile.write(json.dumps(db.get("orders", []), ensure_ascii=False).encode('utf-8'))

        elif path == '/api/settings':
            self._set_headers(200)
            self.wfile.write(json.dumps(db.get("settings", {}), ensure_ascii=False).encode('utf-8'))

        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode('utf-8'))

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'
        
        try:
            req_data = json.loads(body)
        except Exception:
            req_data = {}

        db = load_db()

        if path == '/api/orders':
            # Create new order
            new_order = {
                "id": req_data.get("id", f"ORD-{datetime.now().strftime('%Y%m%d')}-{int(datetime.now().timestamp()) % 1000:03d}"),
                "tableId": req_data.get("tableId", "t-1"),
                "tableName": req_data.get("tableName", "1"),
                "createdAt": datetime.now().isoformat(),
                "status": "pending",
                "paymentStatus": "unpaid",
                "paymentMethod": req_data.get("paymentMethod", "promptpay"),
                "items": req_data.get("items", []),
                "subtotal": req_data.get("subtotal", 0),
                "total": req_data.get("total", 0)
            }

            # Update table status to occupied
            for t in db.get("tables", []):
                if t.get("name") == str(new_order["tableName"]) or t.get("id") == new_order["tableId"]:
                    t["status"] = "occupied"

            db.setdefault("orders", []).insert(0, new_order)
            save_db(db)

            self._set_headers(201)
            self.wfile.write(json.dumps({"success": True, "order": new_order}, ensure_ascii=False).encode('utf-8'))

        elif path == '/api/checkout':
            # Settle table orders
            table_id = req_data.get("tableId")
            if table_id:
                for o in db.get("orders", []):
                    if o.get("tableId") == table_id and o.get("paymentStatus") == "unpaid":
                        o["paymentStatus"] = "paid"
                        o["status"] = "completed"

                for t in db.get("tables", []):
                    if t.get("id") == table_id:
                        t["status"] = "available"

                save_db(db)
                self._set_headers(200)
                self.wfile.write(json.dumps({"success": True, "message": "Table checked out successfully"}, ensure_ascii=False).encode('utf-8'))
            else:
                self._set_headers(400)
                self.wfile.write(json.dumps({"error": "Missing tableId"}).encode('utf-8'))

        elif path == '/api/settings':
            db["settings"] = req_data
            save_db(db)
            self._set_headers(200)
            self.wfile.write(json.dumps({"success": True, "settings": db["settings"]}, ensure_ascii=False).encode('utf-8'))

        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode('utf-8'))

def run_server():
    print(f"🚀 Starting ครัวลุงหนุ่ย Backend API Server on http://localhost:{PORT}")
    print(f"📁 Database file: {DB_FILE}")
    with socketserver.TCPServer(("", PORT), POSAPIHandler) as httpd:
        httpd.serve_forever()

if __name__ == '__main__':
    run_server()
