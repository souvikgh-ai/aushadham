-- MediStock AI: Autonomous Pharmacy Inventory Intelligence & Billing
-- PostgreSQL / Supabase Database Schema

-- 1. Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    average_lead_time INT DEFAULT 3,
    rating NUMERIC(2,1) DEFAULT 4.5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Medicine Categories
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

-- 3. Medicines
CREATE TABLE IF NOT EXISTS medicines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    generic_name TEXT NOT NULL,
    strength TEXT NOT NULL,
    dosage_form TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    category TEXT NOT NULL,
    pack_size TEXT NOT NULL,
    barcode TEXT,
    sku TEXT,
    mrp NUMERIC(10,2) NOT NULL,
    selling_price NUMERIC(10,2) NOT NULL,
    purchase_price NUMERIC(10,2) NOT NULL,
    supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_lead_time INT DEFAULT 3,
    prescription_required BOOLEAN DEFAULT FALSE,
    minimum_stock INT DEFAULT 20,
    safety_stock INT DEFAULT 15,
    current_stock INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Medicine Batches
CREATE TABLE IF NOT EXISTS medicine_batches (
    id TEXT PRIMARY KEY,
    medicine_id TEXT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    batch_number TEXT NOT NULL,
    manufacturing_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INT NOT NULL CHECK (quantity >= 0),
    purchase_price NUMERIC(10,2) NOT NULL,
    selling_price NUMERIC(10,2) NOT NULL,
    mrp NUMERIC(10,2) NOT NULL,
    supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Sales Transactions
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL UNIQUE,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    customer_name TEXT,
    customer_phone TEXT,
    doctor_name TEXT,
    subtotal NUMERIC(10,2) NOT NULL,
    discount NUMERIC(10,2) DEFAULT 0,
    tax NUMERIC(10,2) DEFAULT 0,
    grand_total NUMERIC(10,2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('CASH', 'UPI', 'CARD')),
    prescription_verified BOOLEAN DEFAULT FALSE
);

-- 6. Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
    id TEXT PRIMARY KEY,
    sale_id TEXT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    medicine_id TEXT NOT NULL REFERENCES medicines(id),
    medicine_name TEXT NOT NULL,
    generic_name TEXT,
    batch_id TEXT REFERENCES medicine_batches(id),
    batch_number TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    mrp NUMERIC(10,2) NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    discount_percent NUMERIC(5,2) DEFAULT 0,
    total NUMERIC(10,2) NOT NULL
);

-- 7. Auditable Inventory Transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id TEXT PRIMARY KEY,
    medicine_id TEXT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL,
    batch_id TEXT,
    batch_number TEXT,
    type TEXT NOT NULL CHECK (type IN ('SALE', 'PURCHASE', 'RETURN', 'ADJUSTMENT', 'EXPIRY', 'DAMAGE')),
    quantity_change INT NOT NULL,
    previous_stock INT NOT NULL,
    new_stock INT NOT NULL,
    reference_id TEXT,
    notes TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
    id TEXT PRIMARY KEY,
    po_number TEXT NOT NULL UNIQUE,
    supplier_id TEXT REFERENCES suppliers(id),
    supplier_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Draft', 'Ordered', 'Partially Received', 'Received', 'Cancelled')),
    order_date DATE NOT NULL,
    expected_delivery_date DATE NOT NULL,
    received_date DATE,
    total_amount NUMERIC(10,2) NOT NULL,
    notes TEXT,
    auto_generated_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id TEXT PRIMARY KEY,
    purchase_order_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    medicine_id TEXT NOT NULL REFERENCES medicines(id),
    medicine_name TEXT NOT NULL,
    ordered_quantity INT NOT NULL,
    unit_purchase_price NUMERIC(10,2) NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    received_quantity INT DEFAULT 0
);

-- 10. Real-time Inventory Alerts
CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('STOCKOUT', 'EXPIRY', 'LOW_STOCK', 'OVERSTOCK', 'DEMAND_SPIKE', 'SLOW_MOVING')),
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    medicine_id TEXT REFERENCES medicines(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL,
    batch_number TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    resolved BOOLEAN DEFAULT FALSE
);

-- 11. AI Recommendations
CREATE TABLE IF NOT EXISTS recommendations (
    id TEXT PRIMARY KEY,
    medicine_id TEXT REFERENCES medicines(id) ON DELETE CASCADE,
    medicine_name TEXT NOT NULL,
    type TEXT NOT NULL,
    priority TEXT NOT NULL,
    current_stock INT NOT NULL,
    average_daily_sales NUMERIC(6,2) NOT NULL,
    predicted_stockout_days NUMERIC(5,1),
    recommended_order_quantity INT NOT NULL,
    what TEXT NOT NULL,
    why TEXT NOT NULL,
    "when" TEXT NOT NULL,
    how_much TEXT NOT NULL,
    supplier_id TEXT,
    supplier_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_batches_med_expiry ON medicine_batches(medicine_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_sale_items_med ON sale_items(medicine_id);
CREATE INDEX IF NOT EXISTS idx_inv_tx_med ON inventory_transactions(medicine_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_sales_timestamp ON sales(timestamp);
