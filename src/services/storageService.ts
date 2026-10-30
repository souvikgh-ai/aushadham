import type { 
  Medicine, 
  MedicineBatch, 
  Supplier, 
  SaleTransaction, 
  InventoryTransaction, 
  PurchaseOrder, 
  PharmacySettings,
  CartItem
} from '../types/pharmacy';
import { 
  INITIAL_MEDICINES, 
  INITIAL_BATCHES, 
  INITIAL_SUPPLIERS, 
  generateInitialSales, 
  INITIAL_PURCHASE_ORDERS, 
  INITIAL_INVENTORY_TRANSACTIONS 
} from './demoData';
import { 
  DEFAULT_SETTINGS, 
  calculateValidStock, 
  getDaysToExpiry 
} from './inventoryEngine';

const KEYS = {
  MEDICINES: 'medistock_medicines',
  BATCHES: 'medistock_batches',
  SUPPLIERS: 'medistock_suppliers',
  SALES: 'medistock_sales',
  INVENTORY_TXS: 'medistock_inventory_transactions',
  PURCHASE_ORDERS: 'medistock_purchase_orders',
  SETTINGS: 'medistock_settings',
  INITIALIZED: 'medistock_initialized_v2',
};

export class StorageService {
  /**
   * Initialize or retrieve local state
   */
  static initialize(): {
    medicines: Medicine[];
    batches: MedicineBatch[];
    suppliers: Supplier[];
    sales: SaleTransaction[];
    inventoryTransactions: InventoryTransaction[];
    purchaseOrders: PurchaseOrder[];
    settings: PharmacySettings;
  } {
    const isInit = localStorage.getItem(KEYS.INITIALIZED);
    if (!isInit) {
      return this.resetToDemoData();
    }

    try {
      const medicines = JSON.parse(localStorage.getItem(KEYS.MEDICINES) || '[]');
      const batches = JSON.parse(localStorage.getItem(KEYS.BATCHES) || '[]');
      const suppliers = JSON.parse(localStorage.getItem(KEYS.SUPPLIERS) || '[]');
      const sales = JSON.parse(localStorage.getItem(KEYS.SALES) || '[]');
      const inventoryTransactions = JSON.parse(localStorage.getItem(KEYS.INVENTORY_TXS) || '[]');
      const purchaseOrders = JSON.parse(localStorage.getItem(KEYS.PURCHASE_ORDERS) || '[]');
      const settings = JSON.parse(localStorage.getItem(KEYS.SETTINGS) || JSON.stringify(DEFAULT_SETTINGS));

      // If any core array is empty, re-seed
      if (!medicines.length || !batches.length || !suppliers.length) {
        return this.resetToDemoData();
      }

      return { medicines, batches, suppliers, sales, inventoryTransactions, purchaseOrders, settings };
    } catch {
      return this.resetToDemoData();
    }
  }

  /**
   * Reset all data back to the clean, rich demo state
   */
  static resetToDemoData() {
    const medicines = [...INITIAL_MEDICINES];
    const batches = [...INITIAL_BATCHES];
    const suppliers = [...INITIAL_SUPPLIERS];
    const sales = generateInitialSales();
    const purchaseOrders = [...INITIAL_PURCHASE_ORDERS];
    const inventoryTransactions = [...INITIAL_INVENTORY_TRANSACTIONS];
    const settings = { ...DEFAULT_SETTINGS };

    // Synchronize medicine stock from valid batches
    medicines.forEach(m => {
      const medBatches = batches.filter(b => b.medicineId === m.id);
      m.currentStock = calculateValidStock(medBatches);
    });

    localStorage.setItem(KEYS.MEDICINES, JSON.stringify(medicines));
    localStorage.setItem(KEYS.BATCHES, JSON.stringify(batches));
    localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify(suppliers));
    localStorage.setItem(KEYS.SALES, JSON.stringify(sales));
    localStorage.setItem(KEYS.PURCHASE_ORDERS, JSON.stringify(purchaseOrders));
    localStorage.setItem(KEYS.INVENTORY_TXS, JSON.stringify(inventoryTransactions));
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    localStorage.setItem(KEYS.INITIALIZED, 'true');

    return { medicines, batches, suppliers, sales, inventoryTransactions, purchaseOrders, settings };
  }

  static saveMedicines(data: Medicine[]) {
    localStorage.setItem(KEYS.MEDICINES, JSON.stringify(data));
  }

  static saveBatches(data: MedicineBatch[]) {
    localStorage.setItem(KEYS.BATCHES, JSON.stringify(data));
  }

  static saveSuppliers(data: Supplier[]) {
    localStorage.setItem(KEYS.SUPPLIERS, JSON.stringify(data));
  }

  static saveSales(data: SaleTransaction[]) {
    localStorage.setItem(KEYS.SALES, JSON.stringify(data));
  }

  static saveInventoryTransactions(data: InventoryTransaction[]) {
    localStorage.setItem(KEYS.INVENTORY_TXS, JSON.stringify(data));
  }

  static savePurchaseOrders(data: PurchaseOrder[]) {
    localStorage.setItem(KEYS.PURCHASE_ORDERS, JSON.stringify(data));
  }

  static saveSettings(data: PharmacySettings) {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(data));
  }

  /**
   * Process a Complete Pharmacy Sale:
   * 1. Validate items and FEFO batch availability
   * 2. Deduct batch inventory
   * 3. Recompute medicine currentStock
   * 4. Record auditable InventoryTransactions of type 'SALE'
   * 5. Record SaleTransaction
   */
  static processSale(
    cartItems: CartItem[],
    customer: { name?: string; phone?: string; doctor?: string; paymentMethod: 'CASH' | 'UPI' | 'CARD'; prescriptionVerified: boolean },
    currentMedicines: Medicine[],
    currentBatches: MedicineBatch[],
    currentSales: SaleTransaction[],
    currentInventoryTxs: InventoryTransaction[]
  ): {
    updatedMedicines: Medicine[];
    updatedBatches: MedicineBatch[];
    newSale: SaleTransaction;
    updatedSales: SaleTransaction[];
    updatedInventoryTxs: InventoryTransaction[];
    error?: string;
  } {
    if (!cartItems.length) {
      return {
        updatedMedicines: currentMedicines,
        updatedBatches: currentBatches,
        newSale: null as any,
        updatedSales: currentSales,
        updatedInventoryTxs: currentInventoryTxs,
        error: 'Cart is empty. Please add medicines before checkout.'
      };
    }

    const updatedBatches = [...currentBatches];
    const updatedMedicines = [...currentMedicines];
    const newInventoryTxs: InventoryTransaction[] = [];
    const saleItems = [];
    const timestamp = new Date().toISOString();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    for (const item of cartItems) {
      const batchIdx = updatedBatches.findIndex(b => b.id === item.selectedBatch.id);
      if (batchIdx === -1) {
        return {
          updatedMedicines: currentMedicines,
          updatedBatches: currentBatches,
          newSale: null as any,
          updatedSales: currentSales,
          updatedInventoryTxs: currentInventoryTxs,
          error: `Batch ${item.selectedBatch.batchNumber} for ${item.medicine.name} not found.`
        };
      }

      const targetBatch = updatedBatches[batchIdx];

      // Check expiry
      if (getDaysToExpiry(targetBatch.expiryDate) <= 0) {
        return {
          updatedMedicines: currentMedicines,
          updatedBatches: currentBatches,
          newSale: null as any,
          updatedSales: currentSales,
          updatedInventoryTxs: currentInventoryTxs,
          error: `Batch ${targetBatch.batchNumber} of ${item.medicine.name} has expired and cannot be sold.`
        };
      }

      // Check stock
      if (targetBatch.quantity < item.quantity) {
        return {
          updatedMedicines: currentMedicines,
          updatedBatches: currentBatches,
          newSale: null as any,
          updatedSales: currentSales,
          updatedInventoryTxs: currentInventoryTxs,
          error: `Insufficient stock in batch ${targetBatch.batchNumber} for ${item.medicine.name}. Available: ${targetBatch.quantity}, Requested: ${item.quantity}.`
        };
      }

      const prevBatchQty = targetBatch.quantity;
      const newBatchQty = prevBatchQty - item.quantity;
      updatedBatches[batchIdx] = {
        ...targetBatch,
        quantity: newBatchQty,
      };

      // Find medicine to record previous and new stock
      const medIdx = updatedMedicines.findIndex(m => m.id === item.medicine.id);
      const prevMedStock = updatedMedicines[medIdx].currentStock;
      const newMedStock = Math.max(0, prevMedStock - item.quantity);
      updatedMedicines[medIdx] = {
        ...updatedMedicines[medIdx],
        currentStock: newMedStock,
        updatedAt: timestamp,
      };

      // Add to inventory transactions
      newInventoryTxs.push({
        id: `itx-sale-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        medicineId: item.medicine.id,
        medicineName: item.medicine.name,
        batchId: targetBatch.id,
        batchNumber: targetBatch.batchNumber,
        type: 'SALE',
        quantityChange: -item.quantity,
        previousStock: prevMedStock,
        newStock: newMedStock,
        referenceId: invoiceNumber,
        notes: `Sold ${item.quantity} units to ${customer.name || 'Walk-in Customer'}`,
        timestamp,
      });

      const lineTotal = Math.round(item.quantity * item.medicine.sellingPrice * (1 - (item.discountPercent / 100)));
      saleItems.push({
        medicineId: item.medicine.id,
        medicineName: item.medicine.name,
        genericName: item.medicine.genericName,
        batchId: targetBatch.id,
        batchNumber: targetBatch.batchNumber,
        expiryDate: targetBatch.expiryDate,
        quantity: item.quantity,
        mrp: item.medicine.mrp,
        unitPrice: item.medicine.sellingPrice,
        discountPercent: item.discountPercent,
        total: lineTotal,
      });
    }

    const subtotal = saleItems.reduce((acc, curr) => acc + curr.total, 0);
    const tax = Math.round(subtotal * 0.05); // 5% GST
    const grandTotal = subtotal + tax;

    const newSale: SaleTransaction = {
      id: `tx-${Date.now()}`,
      invoiceNumber,
      timestamp,
      customerName: customer.name || 'Walk-in Customer',
      customerPhone: customer.phone,
      doctorName: customer.doctor,
      items: saleItems,
      subtotal,
      discount: 0,
      tax,
      grandTotal,
      paymentMethod: customer.paymentMethod,
      prescriptionVerified: customer.prescriptionVerified,
    };

    const updatedSales = [newSale, ...currentSales];
    const updatedInventoryTxs = [...newInventoryTxs, ...currentInventoryTxs];

    // Persist
    this.saveBatches(updatedBatches);
    this.saveMedicines(updatedMedicines);
    this.saveSales(updatedSales);
    this.saveInventoryTransactions(updatedInventoryTxs);

    return {
      updatedMedicines,
      updatedBatches,
      newSale,
      updatedSales,
      updatedInventoryTxs,
    };
  }

  /**
   * Receive a Purchase Order and increase inventory
   */
  static receivePurchaseOrder(
    poId: string,
    currentPOs: PurchaseOrder[],
    currentMedicines: Medicine[],
    currentBatches: MedicineBatch[],
    currentInventoryTxs: InventoryTransaction[]
  ): {
    updatedPOs: PurchaseOrder[];
    updatedMedicines: Medicine[];
    updatedBatches: MedicineBatch[];
    updatedInventoryTxs: InventoryTransaction[];
    error?: string;
  } {
    const poIdx = currentPOs.findIndex(p => p.id === poId);
    if (poIdx === -1) {
      return {
        updatedPOs: currentPOs,
        updatedMedicines: currentMedicines,
        updatedBatches: currentBatches,
        updatedInventoryTxs: currentInventoryTxs,
        error: 'Purchase order not found.',
      };
    }

    const targetPO = currentPOs[poIdx];
    if (targetPO.status === 'Received') {
      return {
        updatedPOs: currentPOs,
        updatedMedicines: currentMedicines,
        updatedBatches: currentBatches,
        updatedInventoryTxs: currentInventoryTxs,
        error: 'Purchase order has already been received.',
      };
    }

    const updatedBatches = [...currentBatches];
    const updatedMedicines = [...currentMedicines];
    const newInventoryTxs: InventoryTransaction[] = [];
    const timestamp = new Date().toISOString();
    const expiryDateNextYear = new Date(Date.now() + (365 * 2 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];

    for (const item of targetPO.items) {
      const medIdx = updatedMedicines.findIndex(m => m.id === item.medicineId);
      if (medIdx === -1) continue;

      const med = updatedMedicines[medIdx];
      const prevStock = med.currentStock;
      const newStock = prevStock + item.orderedQuantity;

      // Add to a new received batch
      const newBatchNumber = `RCV-${Date.now().toString().slice(-4)}`;
      const newBatch: MedicineBatch = {
        id: `bat-rcv-${Date.now()}-${item.medicineId}`,
        medicineId: item.medicineId,
        batchNumber: newBatchNumber,
        manufacturingDate: new Date().toISOString().split('T')[0],
        expiryDate: expiryDateNextYear,
        quantity: item.orderedQuantity,
        purchasePrice: item.unitPurchasePrice,
        sellingPrice: med.sellingPrice,
        mrp: med.mrp,
        supplierId: targetPO.supplierId,
        createdAt: timestamp,
      };

      updatedBatches.push(newBatch);

      updatedMedicines[medIdx] = {
        ...med,
        currentStock: newStock,
        updatedAt: timestamp,
      };

      newInventoryTxs.push({
        id: `itx-po-${Date.now()}-${item.medicineId}`,
        medicineId: med.id,
        medicineName: med.name,
        batchId: newBatch.id,
        batchNumber: newBatchNumber,
        type: 'PURCHASE',
        quantityChange: item.orderedQuantity,
        previousStock: prevStock,
        newStock: newStock,
        referenceId: targetPO.poNumber,
        notes: `PO Received from ${targetPO.supplierName}`,
        timestamp,
      });

      item.receivedQuantity = item.orderedQuantity;
    }

    const updatedPO: PurchaseOrder = {
      ...targetPO,
      status: 'Received',
      receivedDate: timestamp.split('T')[0],
    };

    const updatedPOs = [...currentPOs];
    updatedPOs[poIdx] = updatedPO;

    const updatedInventoryTxs = [...newInventoryTxs, ...currentInventoryTxs];

    this.savePurchaseOrders(updatedPOs);
    this.saveBatches(updatedBatches);
    this.saveMedicines(updatedMedicines);
    this.saveInventoryTransactions(updatedInventoryTxs);

    return {
      updatedPOs,
      updatedMedicines,
      updatedBatches,
      updatedInventoryTxs,
    };
  }
}
