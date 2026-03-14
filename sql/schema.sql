CREATE DATABASE IF NOT EXISTS customer_po_tracking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE customer_po_tracking;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('data_entry', 'data_manager', 'system_admin') NOT NULL DEFAULT 'data_entry',
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  tax_no VARCHAR(100),
  branch VARCHAR(100),
  contact_person VARCHAR(255),
  mobile_phone VARCHAR(50),
  email VARCHAR(255),
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bst_quotations (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  bst_quotation_no VARCHAR(100) NOT NULL UNIQUE,
  bst_customer_id BIGINT NOT NULL,
  bst_quotation_date DATE NOT NULL,
  file_path VARCHAR(255),
  detail VARCHAR(255),
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_quotation_customer FOREIGN KEY (bst_customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS po_tracking (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  customer_id BIGINT NOT NULL,
  customer_po_no VARCHAR(100) NOT NULL UNIQUE,
  customer_po_file_path VARCHAR(255),
  receive_date DATE NOT NULL,
  delivery_due_date DATE NOT NULL,
  bst_customer_id BIGINT,
  detail VARCHAR(100),
  status ENUM('on_process', 'completed') NOT NULL DEFAULT 'on_process',
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_po_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_po_quotation FOREIGN KEY (bst_customer_id) REFERENCES bst_quotations(id)
);

CREATE TABLE IF NOT EXISTS issued_po_supplier (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  po_tracking_id BIGINT NOT NULL,
  bst_po_no VARCHAR(100) NOT NULL,
  supplier_name VARCHAR(255) NOT NULL,
  issued_date DATE NOT NULL,
  file_path VARCHAR(255),
  detail VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_issued_po_tracking FOREIGN KEY (po_tracking_id) REFERENCES po_tracking(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS goods_receive (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  po_tracking_id BIGINT NOT NULL,
  supplier_invoice_no VARCHAR(100) NOT NULL,
  supplier_name VARCHAR(255),
  receive_date DATE NOT NULL,
  file_path VARCHAR(255),
  detail VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_goods_receive_po_tracking FOREIGN KEY (po_tracking_id) REFERENCES po_tracking(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shipping (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  po_tracking_id BIGINT NOT NULL,
  shipping_date DATE NOT NULL,
  detail VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_shipping_po_tracking FOREIGN KEY (po_tracking_id) REFERENCES po_tracking(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS billing (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  po_tracking_id BIGINT NOT NULL,
  bst_invoice_no VARCHAR(100) NOT NULL,
  billing_date DATE NOT NULL,
  file_path VARCHAR(255),
  detail VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_billing_po_tracking FOREIGN KEY (po_tracking_id) REFERENCES po_tracking(id) ON DELETE CASCADE
);

INSERT INTO users (username, password_hash, name, role, status)
VALUES ('admin', '$2b$10$KpDaEYVrptkO3AVjUYHc8O4EsB6RxR7hmE6GfoNa6W8cnn2gOBdgy', 'System Administrator', 'system_admin', 'active')
ON DUPLICATE KEY UPDATE username = VALUES(username);
