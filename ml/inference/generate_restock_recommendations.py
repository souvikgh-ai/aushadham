"""
Aushadham Intelligent Restocking Engine
Implements deterministic & ML-informed replenishment calculations:
- Lead Time Demand = Daily Forecast * Supplier Lead Time
- Reorder Point = Lead Time Demand + Safety Stock
- Target Stock Level = (Daily Forecast * Target Days) + Safety Stock
- Recommended Order Quantity = max(0, Target Stock - Current Stock - Pending Orders)
"""

import math

def calculate_restock_recommendation(
    current_stock: int,
    daily_demand_forecast: float,
    supplier_lead_time_days: int,
    safety_stock: int,
    pending_orders: int = 0,
    target_coverage_days: int = 30,
    min_order_batch: int = 1
) -> dict:
    # 1. Lead Time Demand
    lead_time_demand = daily_demand_forecast * max(1, supplier_lead_time_days)
    
    # 2. Reorder Point (ROP)
    reorder_point = math.ceil(lead_time_demand + safety_stock)

    # 3. Target Stock Level
    target_stock = math.ceil((daily_demand_forecast * target_coverage_days) + safety_stock)

    # 4. Net Inventory Position
    net_inventory = current_stock + pending_orders

    # 5. Recommendation Trigger
    is_restock_needed = net_inventory <= reorder_point

    if is_restock_needed:
        raw_quantity = target_stock - net_inventory
        # Round up to multiple of min_order_batch
        order_quantity = math.ceil(max(0, raw_quantity) / min_order_batch) * min_order_batch
        
        # Determine Urgency
        if current_stock <= safety_stock * 0.5:
            urgency = "CRITICAL"
            reason = f"Current stock ({current_stock}) is below 50% safety stock ({safety_stock}). High risk of stockout during {supplier_lead_time_days}-day lead time."
        elif current_stock <= safety_stock:
            urgency = "HIGH"
            reason = f"Stock ({current_stock}) has breached safety stock threshold ({safety_stock}). Replenish to avoid depletion."
        else:
            urgency = "MODERATE"
            reason = f"Net position ({net_inventory}) is at or below reorder point ({reorder_point}). Order placed now will arrive before stockout."
    else:
        order_quantity = 0
        urgency = "NONE"
        reason = f"Current stock ({current_stock}) exceeds reorder point ({reorder_point}). Inventory is healthy."

    return {
        "is_restock_needed": is_restock_needed,
        "recommended_order_quantity": order_quantity,
        "reorder_point": reorder_point,
        "lead_time_demand": round(lead_time_demand, 1),
        "target_stock_level": target_stock,
        "urgency": urgency,
        "reason": reason,
        "supplier_lead_time_days": supplier_lead_time_days,
        "safety_stock": safety_stock
    }

if __name__ == "__main__":
    rec = calculate_restock_recommendation(
        current_stock=18,
        daily_demand_forecast=8.5,
        supplier_lead_time_days=4,
        safety_stock=20,
        pending_orders=0
    )
    print("Replenishment Recommendation:", rec)
