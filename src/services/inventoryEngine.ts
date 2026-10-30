import type { 
  Medicine, 
  MedicineBatch, 
  SaleTransaction, 
  PharmacySettings, 
  ExpiryStatus, 
  InventoryStatus, 
  Recommendation, 
  Alert, 
  DemandForecast,
  Supplier 
} from '../types/pharmacy';

export const DEFAULT_SETTINGS: PharmacySettings = {
  pharmacyName: 'AUSHADHAM',
  pharmacyAddress: 'Plot 42, Health City, Sector 5, Bangalore - 560034',
  pharmacyPhone: '+91 98765 43210',
  pharmacyGst: '29ABCDE1234F1Z5',
  currency: '₹',
  taxRatePercent: 5,
  lowStockThresholdDays: 7,
  expiryCriticalDays: 30,
  expiryWarningDays: 90,
  forecastPeriodDays: 30,
  defaultSafetyStock: 15,
};

/**
 * Calculate difference in days between target date and today
 */
export function getDaysToExpiry(expiryDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDateStr);
  exp.setHours(0, 0, 0, 0);
  const diffTime = exp.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Determine expiry status according to configurable thresholds
 */
export function getExpiryStatus(expiryDateStr: string, settings = DEFAULT_SETTINGS): ExpiryStatus {
  const days = getDaysToExpiry(expiryDateStr);
  if (days <= 0) return 'EXPIRED';
  if (days <= settings.expiryCriticalDays) return 'CRITICAL';
  if (days <= settings.expiryWarningDays) return 'EXPIRING_SOON';
  return 'SAFE';
}

/**
 * FEFO: First Expiry, First Out
 * Prioritize non-expired batches with earliest expiry date
 */
export function getSortedBatchesFEFO(batches: MedicineBatch[]): MedicineBatch[] {
  return [...batches]
    .filter(b => b.quantity > 0)
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
}

/**
 * Get active non-expired batch for billing using FEFO
 */
export function getPreferredBatchForSale(batches: MedicineBatch[]): {
  batch: MedicineBatch | null;
  error?: string;
} {
  const availableBatches = batches.filter(b => b.quantity > 0);
  if (availableBatches.length === 0) {
    return { batch: null, error: 'No stock available for this medicine.' };
  }

  const validBatches = availableBatches
    .filter(b => getDaysToExpiry(b.expiryDate) > 0)
    .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());

  if (validBatches.length === 0) {
    return { batch: null, error: 'All available batches of this medicine have expired and cannot be sold.' };
  }

  return { batch: validBatches[0] };
}

/**
 * Calculate total valid available stock for a medicine
 */
export function calculateValidStock(batches: MedicineBatch[]): number {
  return batches
    .filter(b => getDaysToExpiry(b.expiryDate) > 0)
    .reduce((sum, b) => sum + Math.max(0, b.quantity), 0);
}

/**
 * Calculate Average Daily Sales (ADS) over the past 30 days
 */
export function calculateAverageDailySales(
  medicineId: string, 
  sales: SaleTransaction[], 
  daysWindow = 30
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysWindow);

  let totalUnits = 0;
  for (const sale of sales) {
    const saleDate = new Date(sale.timestamp);
    if (saleDate >= cutoff) {
      for (const item of sale.items) {
        if (item.medicineId === medicineId) {
          totalUnits += item.quantity;
        }
      }
    }
  }

  const ads = totalUnits / daysWindow;
  return Number(ads.toFixed(2));
}

/**
 * Calculate recent sales velocity (e.g., last 7 days)
 */
export function calculateRecentSalesVelocity(
  medicineId: string, 
  sales: SaleTransaction[], 
  recentDays = 7
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - recentDays);

  let totalUnits = 0;
  for (const sale of sales) {
    const saleDate = new Date(sale.timestamp);
    if (saleDate >= cutoff) {
      for (const item of sale.items) {
        if (item.medicineId === medicineId) {
          totalUnits += item.quantity;
        }
      }
    }
  }

  return Number((totalUnits / recentDays).toFixed(2));
}

/**
 * Calculate stockout days
 */
export function calculateDaysUntilStockout(currentStock: number, averageDailySales: number): number | null {
  if (averageDailySales <= 0) return null;
  return Number((currentStock / averageDailySales).toFixed(1));
}

/**
 * Calculate Reorder Point
 * reorderPoint = (averageDailySales * supplierLeadTime) + safetyStock
 */
export function calculateReorderPoint(
  averageDailySales: number, 
  supplierLeadTime: number, 
  safetyStock: number
): number {
  return Math.ceil((averageDailySales * supplierLeadTime) + safetyStock);
}

/**
 * Calculate Recommended Reorder Quantity
 * targetStock = (averageDailySales * forecastPeriodDays) + safetyStock
 * recommendedOrder = Math.max(0, targetStock - currentStock)
 */
export function calculateRecommendedOrderQuantity(
  currentStock: number,
  averageDailySales: number,
  forecastPeriodDays: number,
  safetyStock: number
): number {
  if (averageDailySales <= 0) {
    return Math.max(0, safetyStock - currentStock);
  }
  const targetStock = (averageDailySales * forecastPeriodDays) + safetyStock;
  return Math.max(0, Math.ceil(targetStock - currentStock));
}

/**
 * Evaluate medicine inventory status
 */
export function getMedicineInventoryStatus(
  medicine: Medicine,
  batches: MedicineBatch[],
  averageDailySales: number,
  settings = DEFAULT_SETTINGS
): InventoryStatus {
  const validStock = calculateValidStock(batches);
  
  // Check if any batch is critical or expiring soon
  const hasExpiringBatches = batches.some(b => {
    const days = getDaysToExpiry(b.expiryDate);
    return days > 0 && days <= settings.expiryWarningDays && b.quantity > 0;
  });

  const daysToStockout = calculateDaysUntilStockout(validStock, averageDailySales);

  if (validStock <= 0 || (daysToStockout !== null && daysToStockout <= medicine.supplierLeadTime)) {
    return 'CRITICAL';
  }

  const reorderPoint = calculateReorderPoint(averageDailySales, medicine.supplierLeadTime, medicine.safetyStock);
  if (validStock <= reorderPoint || validStock <= medicine.minimumStock) {
    return 'LOW';
  }

  // Overstock check: stock > 2.5 times 30-day demand
  const monthlyDemand = averageDailySales * 30;
  if (monthlyDemand > 0 && validStock > Math.max(50, monthlyDemand * 2.5)) {
    return 'OVERSTOCK';
  }

  if (hasExpiringBatches) {
    return 'EXPIRING';
  }

  return 'HEALTHY';
}

/**
 * Generate Weighted Moving Average Demand Forecast
 */
export function generateDemandForecast(
  medicine: Medicine,
  sales: SaleTransaction[],
  batches: MedicineBatch[]
): DemandForecast {
  const currentStock = calculateValidStock(batches);
  const ads = calculateAverageDailySales(medicine.id, sales, 30);
  const recentAds = calculateRecentSalesVelocity(medicine.id, sales, 7);

  // Group historical sales into 4 weekly buckets for WMA
  const now = new Date();
  const weeklyUnits = [0, 0, 0, 0]; // [Week 1 (recent), Week 2, Week 3, Week 4]

  sales.forEach(sale => {
    const saleDate = new Date(sale.timestamp);
    const diffDays = Math.floor((now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 28) {
      const weekIdx = Math.floor(diffDays / 7);
      if (weekIdx >= 0 && weekIdx < 4) {
        sale.items.forEach(item => {
          if (item.medicineId === medicine.id) {
            weeklyUnits[weekIdx] += item.quantity;
          }
        });
      }
    }
  });

  // Weights: Week 1 (40%), Week 2 (30%), Week 3 (20%), Week 4 (10%)
  const wmaDaily = ((weeklyUnits[0] * 0.40) + (weeklyUnits[1] * 0.30) + (weeklyUnits[2] * 0.20) + (weeklyUnits[3] * 0.10)) / 7;
  const effectiveDaily = wmaDaily > 0 ? wmaDaily : ads;

  const isDemandSpike = ads > 0 && recentAds >= ads * 1.5 && weeklyUnits[0] >= 15;
  const spikePercentage = isDemandSpike ? Math.round(((recentAds - ads) / ads) * 100) : undefined;

  const weeklyTrend = [
    { week: '3 Wks Ago', units: weeklyUnits[3] },
    { week: '2 Wks Ago', units: weeklyUnits[2] },
    { week: 'Last Week', units: weeklyUnits[1] },
    { week: 'This Week', units: weeklyUnits[0] },
  ];

  return {
    medicineId: medicine.id,
    medicineName: medicine.name,
    category: medicine.category,
    currentStock,
    historicalDays: 30,
    averageDailySales: ads,
    forecast7Day: Math.max(0, Math.ceil(effectiveDaily * 7)),
    forecast14Day: Math.max(0, Math.ceil(effectiveDaily * 14)),
    forecast30Day: Math.max(0, Math.ceil(effectiveDaily * 30)),
    method: 'Weighted Moving Average',
    isDemandSpike,
    spikePercentage,
    weeklyTrend,
  };
}

/**
 * Generate AI-Driven Explainable Inventory Recommendations
 */
export function generateAIRecommendations(
  medicines: Medicine[],
  batches: MedicineBatch[],
  sales: SaleTransaction[],
  suppliers: Supplier[],
  settings = DEFAULT_SETTINGS
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  for (const medicine of medicines) {
    const medBatches = batches.filter(b => b.medicineId === medicine.id);
    const currentStock = calculateValidStock(medBatches);
    const ads = calculateAverageDailySales(medicine.id, sales, 30);
    const recentAds = calculateRecentSalesVelocity(medicine.id, sales, 7);
    const daysToStockout = calculateDaysUntilStockout(currentStock, ads);
    const reorderPoint = calculateReorderPoint(ads, medicine.supplierLeadTime, medicine.safetyStock);
    const recommendedQty = calculateRecommendedOrderQuantity(
      currentStock, 
      ads, 
      settings.forecastPeriodDays, 
      medicine.safetyStock
    );

    const supplier = suppliers.find(s => s.id === medicine.supplierId) || {
      id: medicine.supplierId,
      name: 'Primary Pharma Distributor',
      contactPerson: 'Logistics Desk',
      phone: '+91 98000 00000',
      email: 'orders@distributor.com',
      address: 'Pharma Hub, Ind. Area',
      averageLeadTime: medicine.supplierLeadTime,
    };

    // 1. CRITICAL RESTOCK: Stock runs out before supplier lead time!
    if (daysToStockout !== null && daysToStockout <= medicine.supplierLeadTime) {
      recommendations.push({
        id: `rec-crit-${medicine.id}`,
        medicineId: medicine.id,
        medicineName: medicine.name,
        genericName: medicine.genericName,
        type: 'CRITICAL_RESTOCK',
        priority: 'critical',
        currentStock,
        averageDailySales: ads,
        predictedStockoutDays: daysToStockout,
        supplierLeadTime: medicine.supplierLeadTime,
        safetyStock: medicine.safetyStock,
        reorderPoint,
        recommendedOrderQuantity: recommendedQty > 0 ? recommendedQty : medicine.safetyStock * 2,
        what: `Critical Restock: Replenish ${medicine.name}`,
        why: `Current stock (${currentStock} units) is projected to run out in ~${daysToStockout} days, which is less than the ${medicine.supplierLeadTime}-day supplier delivery lead time. High stockout risk for incoming patients.`,
        when: `IMMEDIATELY — Order must be dispatched today to prevent stockout.`,
        howMuch: `Order ${recommendedQty > 0 ? recommendedQty : medicine.safetyStock * 2} units (${medicine.packSize} packs) to reach safe target buffer.`,
        supplierId: supplier.id,
        supplierName: supplier.name,
        unitPurchasePrice: medicine.purchasePrice,
      });
      continue;
    }

    // 2. DEMAND SPIKE: Recent velocity significantly outpaces baseline
    if (ads > 0 && recentAds >= ads * 1.5 && recentAds * 7 >= 14) {
      const spikeRatio = Math.round(((recentAds - ads) / ads) * 100);
      const spikeRecommendedQty = Math.ceil(recommendedQty * 1.3);
      recommendations.push({
        id: `rec-spike-${medicine.id}`,
        medicineId: medicine.id,
        medicineName: medicine.name,
        genericName: medicine.genericName,
        type: 'DEMAND_SPIKE',
        priority: 'high',
        currentStock,
        averageDailySales: ads,
        predictedStockoutDays: daysToStockout,
        supplierLeadTime: medicine.supplierLeadTime,
        safetyStock: medicine.safetyStock,
        reorderPoint,
        recommendedOrderQuantity: spikeRecommendedQty,
        what: `Demand Surge Alert: Adjust supply for ${medicine.name}`,
        why: `Sales velocity spiked by +${spikeRatio}% over the last 7 days (${recentAds} units/day vs 30-day baseline of ${ads} units/day). Current stock will exhaust faster than historical models predict.`,
        when: `Within 48 hours — Anticipate sustained high demand.`,
        howMuch: `Order ${spikeRecommendedQty} units (adjusted with a 30% surge buffer).`,
        supplierId: supplier.id,
        supplierName: supplier.name,
        unitPurchasePrice: medicine.purchasePrice,
      });
      continue;
    }

    // 3. LOW STOCK: Stock below reorder point
    if (currentStock <= reorderPoint || currentStock <= medicine.minimumStock) {
      recommendations.push({
        id: `rec-low-${medicine.id}`,
        medicineId: medicine.id,
        medicineName: medicine.name,
        genericName: medicine.genericName,
        type: 'LOW_STOCK',
        priority: 'high',
        currentStock,
        averageDailySales: ads,
        predictedStockoutDays: daysToStockout,
        supplierLeadTime: medicine.supplierLeadTime,
        safetyStock: medicine.safetyStock,
        reorderPoint,
        recommendedOrderQuantity: recommendedQty,
        what: `Standard Restock: ${medicine.name}`,
        why: `Current stock (${currentStock} units) has fallen below the calculated reorder point of ${reorderPoint} units (Lead Time Demand: ${Math.round(ads * medicine.supplierLeadTime)} + Safety Stock: ${medicine.safetyStock}).`,
        when: `Within ${Math.max(1, Math.floor((daysToStockout || 5) - medicine.supplierLeadTime))} days.`,
        howMuch: `Order ${recommendedQty} units from ${supplier.name}.`,
        supplierId: supplier.id,
        supplierName: supplier.name,
        unitPurchasePrice: medicine.purchasePrice,
      });
      continue;
    }

    // 4. EXPIRY RISK: Check for batches expiring soon with high inventory
    const expiringBatches = medBatches.filter(b => {
      const days = getDaysToExpiry(b.expiryDate);
      return days > 0 && days <= settings.expiryWarningDays && b.quantity > 0;
    });

    if (expiringBatches.length > 0) {
      const soonestBatch = expiringBatches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0];
      const daysLeft = getDaysToExpiry(soonestBatch.expiryDate);
      const daysToSellBatch = ads > 0 ? Math.ceil(soonestBatch.quantity / ads) : 999;
      
      if (daysToSellBatch > daysLeft) {
        recommendations.push({
          id: `rec-exp-${soonestBatch.id}`,
          medicineId: medicine.id,
          medicineName: medicine.name,
          genericName: medicine.genericName,
          type: 'EXPIRY_RISK',
          priority: daysLeft <= 30 ? 'critical' : 'medium',
          currentStock,
          averageDailySales: ads,
          predictedStockoutDays: daysToStockout,
          supplierLeadTime: medicine.supplierLeadTime,
          safetyStock: medicine.safetyStock,
          reorderPoint,
          recommendedOrderQuantity: 0,
          what: `Expiry Mitigation: Batch ${soonestBatch.batchNumber} (${medicine.name})`,
          why: `Batch ${soonestBatch.batchNumber} has ${soonestBatch.quantity} units expiring in ${daysLeft} days. At current sales velocity (${ads} units/day), only ~${Math.round(ads * daysLeft)} units will sell before expiry, risking ${Math.max(0, soonestBatch.quantity - Math.round(ads * daysLeft))} unsellable units (₹${((soonestBatch.quantity - Math.round(ads * daysLeft)) * medicine.purchasePrice).toLocaleString('en-IN')}).`,
          when: `Immediate action required: Prioritize FEFO dispensing or contact supplier for return/exchange credit.`,
          howMuch: `0 reorder — Deplete existing batches first.`,
          supplierId: supplier.id,
          supplierName: supplier.name,
          unitPurchasePrice: medicine.purchasePrice,
        });
        continue;
      }
    }

    // 5. OVERSTOCK: Excessive inventory relative to sales
    const monthlyDemand = ads * 30;
    if (monthlyDemand > 0 && currentStock > Math.max(40, monthlyDemand * 2.8)) {
      const excessUnits = Math.round(currentStock - (monthlyDemand * 1.5));
      const tiedCapital = excessUnits * medicine.purchasePrice;
      recommendations.push({
        id: `rec-over-${medicine.id}`,
        medicineId: medicine.id,
        medicineName: medicine.name,
        genericName: medicine.genericName,
        type: 'OVERSTOCK',
        priority: 'info',
        currentStock,
        averageDailySales: ads,
        predictedStockoutDays: daysToStockout,
        supplierLeadTime: medicine.supplierLeadTime,
        safetyStock: medicine.safetyStock,
        reorderPoint,
        recommendedOrderQuantity: 0,
        what: `Overstock Warning: Pause Reorders for ${medicine.name}`,
        why: `Current stock (${currentStock} units) covers over ${daysToStockout} days of projected demand. Estimated ₹${tiedCapital.toLocaleString('en-IN')} in working capital is tied up, escalating storage and expiry risks.`,
        when: `Hold procurement for the next 45–60 days.`,
        howMuch: `0 reorders until stock drops to ${reorderPoint} units.`,
        supplierId: supplier.id,
        supplierName: supplier.name,
        unitPurchasePrice: medicine.purchasePrice,
      });
      continue;
    }

    // 6. SLOW MOVING: Very low sales velocity with standing stock
    if (currentStock > 20 && ads <= 0.25) {
      recommendations.push({
        id: `rec-slow-${medicine.id}`,
        medicineId: medicine.id,
        medicineName: medicine.name,
        genericName: medicine.genericName,
        type: 'SLOW_MOVING',
        priority: 'info',
        currentStock,
        averageDailySales: ads,
        predictedStockoutDays: daysToStockout,
        supplierLeadTime: medicine.supplierLeadTime,
        safetyStock: medicine.safetyStock,
        reorderPoint,
        recommendedOrderQuantity: 0,
        what: `Slow-Moving Stock: Review ${medicine.name}`,
        why: `Sales velocity is only ${ads} units/day (~${Math.round(ads * 30)} units/month) with ${currentStock} units in inventory (~${daysToStockout || '>180'} days supply). Review distributor return policy or bundle where clinically sound.`,
        when: `Review at next weekly inventory cycle.`,
        howMuch: `Do not reorder. Downsize future purchase pack sizes.`,
        supplierId: supplier.id,
        supplierName: supplier.name,
        unitPurchasePrice: medicine.purchasePrice,
      });
    }
  }

  // Sort by priority: critical -> high -> medium -> info
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, info: 3 };
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Generate Real-time Alerts from active inventory state
 */
export function generateInventoryAlerts(
  medicines: Medicine[],
  batches: MedicineBatch[],
  sales: SaleTransaction[],
  settings = DEFAULT_SETTINGS
): Alert[] {
  const alerts: Alert[] = [];
  const nowStr = new Date().toISOString();

  // Expired batches
  batches.forEach(b => {
    const days = getDaysToExpiry(b.expiryDate);
    const med = medicines.find(m => m.id === b.medicineId);
    if (!med) return;

    if (days <= 0 && b.quantity > 0) {
      alerts.push({
        id: `alt-exp-${b.id}`,
        type: 'EXPIRY',
        severity: 'critical',
        medicineId: med.id,
        medicineName: med.name,
        batchNumber: b.batchNumber,
        title: `Expired Batch Quarantined: ${med.name}`,
        description: `Batch ${b.batchNumber} (${b.quantity} units) expired on ${b.expiryDate}. FEFO has locked this batch from billing.`,
        recommendedAction: `Move to pharmacy quarantine shelf and initiate supplier credit note or safe bio-medical disposal.`,
        timestamp: nowStr,
        resolved: false,
      });
    } else if (days > 0 && days <= settings.expiryCriticalDays && b.quantity > 0) {
      alerts.push({
        id: `alt-exp-crit-${b.id}`,
        type: 'EXPIRY',
        severity: 'high',
        medicineId: med.id,
        medicineName: med.name,
        batchNumber: b.batchNumber,
        title: `Critical Expiry in ${days} Days: ${med.name}`,
        description: `Batch ${b.batchNumber} has ${b.quantity} units expiring on ${b.expiryDate}.`,
        recommendedAction: `Prioritize for current FEFO sales or arrange supplier exchange.`,
        timestamp: nowStr,
        resolved: false,
      });
    }
  });

  // Stockout & Low Stock
  medicines.forEach(med => {
    const medBatches = batches.filter(b => b.medicineId === med.id);
    const validStock = calculateValidStock(medBatches);
    const ads = calculateAverageDailySales(med.id, sales, 30);
    const daysToStockout = calculateDaysUntilStockout(validStock, ads);
    const reorderPoint = calculateReorderPoint(ads, med.supplierLeadTime, med.safetyStock);

    if (validStock <= 0) {
      alerts.push({
        id: `alt-stockout-${med.id}`,
        type: 'STOCKOUT',
        severity: 'critical',
        medicineId: med.id,
        medicineName: med.name,
        title: `Stockout: ${med.name} Unavailable`,
        description: `0 valid units remaining in inventory. Patient demand cannot be fulfilled.`,
        recommendedAction: `Emergency order from local distributor (Lead Time: ${med.supplierLeadTime} days).`,
        timestamp: nowStr,
        resolved: false,
      });
    } else if (daysToStockout !== null && daysToStockout <= med.supplierLeadTime) {
      alerts.push({
        id: `alt-stockout-pred-${med.id}`,
        type: 'STOCKOUT',
        severity: 'critical',
        medicineId: med.id,
        medicineName: med.name,
        title: `Predicted Stockout in ~${daysToStockout} Days: ${med.name}`,
        description: `Current stock (${validStock}) will exhaust before supplier delivery (${med.supplierLeadTime} days lead time).`,
        recommendedAction: `Place express replenishment order immediately.`,
        timestamp: nowStr,
        resolved: false,
      });
    } else if (validStock <= reorderPoint) {
      alerts.push({
        id: `alt-low-${med.id}`,
        type: 'LOW_STOCK',
        severity: 'medium',
        medicineId: med.id,
        medicineName: med.name,
        title: `Low Stock: ${med.name}`,
        description: `Stock level (${validStock}) is at or below reorder threshold (${reorderPoint}).`,
        recommendedAction: `Generate standard replenishment purchase order.`,
        timestamp: nowStr,
        resolved: false,
      });
    }

    // Demand spike alert
    const recentAds = calculateRecentSalesVelocity(med.id, sales, 7);
    if (ads > 0 && recentAds >= ads * 1.5 && recentAds * 7 >= 14) {
      alerts.push({
        id: `alt-spike-${med.id}`,
        type: 'DEMAND_SPIKE',
        severity: 'high',
        medicineId: med.id,
        medicineName: med.name,
        title: `Demand Spike (+${Math.round(((recentAds - ads) / ads) * 100)}%): ${med.name}`,
        description: `Sudden surge in demand detected over the past 7 days (${recentAds} units/day vs ${ads} normal).`,
        recommendedAction: `Increase safety stock buffer and monitor incoming prescription volume.`,
        timestamp: nowStr,
        resolved: false,
      });
    }
  });

  return alerts;
}
