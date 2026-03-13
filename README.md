# Customer PO Tracking System

Production-ready web application for tracking customer purchase orders from receive stage to completion.

## Tech Stack
- Frontend: HTML5, CSS3, JavaScript, Bootstrap 5, DataTables
- Backend: Node.js v20 + Express + EJS
- Database: MySQL 8.0+
- Server: Ubuntu 20.04 + Nginx 1.18 reverse proxy

## Features
- Public search page by `Customer PO No`, `Quotation No`, `Customer Name`
- Public timeline page (vertical timeline, latest event darker, old event gray)
- Authentication (session-based)
- Role-based access control:
  - `data_entry`: PO Tracking
  - `data_manager`: PO Tracking + Quotation + Customer
  - `system_admin`: all menus + User Management + delete PO
- Dashboard:
  - Summary metrics (total receive/on process/completed)
  - Customer chart by month/year filter
  - PO table ordered by closest delivery due date
- PO Tracking management:
  - Step 1 Receive Customer PO
  - Step 2 Issued PO to Supplier (multiple items)
  - Step 3 Goods Receive (multiple items)
  - Step 4 Shipping (multiple items)
  - Step 5 Billing (multiple items)
  - Step 6 Completed
  - Each process step is saved independently
- PDF upload support for PO/Quotation/Issued PO/Goods Receive/Billing

## Database Setup (MySQL 8)

1. Login to MySQL:
```bash
mysql -u root -p
```
Password: `12345678`

2. Run schema:
```bash
SOURCE /absolute/path/to/sql/schema.sql;
```

Default seeded admin user:
- Username: `admin`
- Password: `admin123`

## Local Development (macOS)

1. Install dependencies:
```bash
npm install
```

2. Create env file:
```bash
cp .env.example .env
```

3. Update `.env` if needed:
```env
NODE_ENV=development
PORT=3000
SESSION_SECRET=change-this-secret
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=customer_po_tracking
DB_USER=root
DB_PASSWORD=12345678
UPLOAD_DIR=uploads
```

4. Start app:
```bash
npm run dev
```

5. Open:
- Public: `http://localhost:3000`
- Login: `http://localhost:3000/login`

## Production Deployment (Ubuntu 20.04)

### 1) Install runtime
```bash
sudo apt update
sudo apt install -y nginx mysql-server nodejs npm git
```

### 2) Deploy source
```bash
sudo mkdir -p /var/www/customer-po-tracking
sudo chown -R $USER:$USER /var/www/customer-po-tracking
git clone https://github.com/lnwsathit/Customer-PO-Tracking-System.git /var/www/customer-po-tracking
cd /var/www/customer-po-tracking
npm install --omit=dev
cp .env.example .env
```

### 3) Initialize database
```bash
mysql -u root -p < sql/schema.sql
```

### 4) Configure systemd
```bash
sudo cp deploy/customer-po-tracking.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable customer-po-tracking
sudo systemctl restart customer-po-tracking
sudo systemctl status customer-po-tracking
```

### 5) Configure Nginx
```bash
sudo cp deploy/nginx-customer-po-tracking.conf /etc/nginx/sites-available/customer-po-tracking
sudo ln -s /etc/nginx/sites-available/customer-po-tracking /etc/nginx/sites-enabled/customer-po-tracking
sudo nginx -t
sudo systemctl reload nginx
```

Access from network:
- `http://192.168.1.139`

## GitHub Push

```bash
git init
git add .
git commit -m "Initial production-ready Customer PO Tracking System"
git branch -M main
git remote add origin https://github.com/lnwsathit/Customer-PO-Tracking-System.git
git push -u origin main
```

## Project Structure

- `src/` Express app source
- `views/` EJS pages
- `public/` CSS/JS assets
- `uploads/` uploaded PDFs
- `sql/schema.sql` MySQL schema + seed
- `deploy/` systemd and nginx configs

## Notes
- For production hardening, replace `SESSION_SECRET` and MySQL root usage with a dedicated DB user.
- Run `npm audit fix` and review any breaking changes before applying `--force`.
