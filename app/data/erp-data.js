export const warehouseCatalog = [
  {
    id: 'WH-CENTRAL',
    code: 'WH-001',
    name: 'Central Warehouse',
    location: 'Downtown Industrial Park',
    manager: 'Maya Khan',
    status: 'Active',
    stockUnits: 2840,
    stockValue: 96500,
    sales: 84200,
    purchases: 58600,
    transfers: 18,
    movementCount: 42,
  },
  {
    id: 'WH-DOWNTOWN',
    code: 'WH-002',
    name: 'Downtown Store',
    location: 'Main Market District',
    manager: 'Liam James',
    status: 'Active',
    stockUnits: 1260,
    stockValue: 41800,
    sales: 61000,
    purchases: 24400,
    transfers: 11,
    movementCount: 28,
  },
  {
    id: 'WH-AIRPORT',
    code: 'WH-003',
    name: 'Airport Branch',
    location: 'Airport Terminal Road',
    manager: 'Nadia Shah',
    status: 'Active',
    stockUnits: 980,
    stockValue: 32900,
    sales: 48200,
    purchases: 20500,
    transfers: 9,
    movementCount: 23,
  },
  {
    id: 'WH-NORTH',
    code: 'WH-004',
    name: 'North Hub',
    location: 'North Ridge Avenue',
    manager: 'Omar Ali',
    status: 'Active',
    stockUnits: 760,
    stockValue: 27200,
    sales: 39400,
    purchases: 17800,
    transfers: 8,
    movementCount: 19,
  },
  {
    id: 'WH-RIVERSIDE',
    code: 'WH-005',
    name: 'Riverside Store',
    location: 'Riverside Plaza',
    manager: 'Sara Khan',
    status: 'Active',
    stockUnits: 693,
    stockValue: 23800,
    sales: 36800,
    purchases: 15400,
    transfers: 7,
    movementCount: 17,
  },
  {
    id: 'WH-CITY',
    code: 'WH-006',
    name: 'City Center',
    location: 'City Center Mall',
    manager: 'Hassan Idris',
    status: 'Active',
    stockUnits: 845,
    stockValue: 28750,
    sales: 42600,
    purchases: 19100,
    transfers: 10,
    movementCount: 22,
  },
];

export const productCatalog = [
  { id: 1, sku: 'PRD-1001', name: 'Fresh Milk 1L', category: 'Dairy', price: 3.2, costPrice: 2.1, stock: 48, reorderLevel: 20, warehouseId: 'WH-CENTRAL', warehouse: 'Central Warehouse', status: 'In Stock' },
  { id: 2, sku: 'PRD-1044', name: 'Whole Wheat Bread', category: 'Bakery', price: 2.8, costPrice: 1.7, stock: 16, reorderLevel: 18, warehouseId: 'WH-DOWNTOWN', warehouse: 'Downtown Store', status: 'Low Stock' },
  { id: 3, sku: 'PRD-1107', name: 'Bananas', category: 'Fruit', price: 1.9, costPrice: 1.1, stock: 72, reorderLevel: 30, warehouseId: 'WH-CITY', warehouse: 'City Center', status: 'In Stock' },
  { id: 4, sku: 'PRD-1182', name: 'Rice 5kg', category: 'Groceries', price: 12.5, costPrice: 8.3, stock: 21, reorderLevel: 12, warehouseId: 'WH-CENTRAL', warehouse: 'Central Warehouse', status: 'In Stock' },
  { id: 5, sku: 'PRD-1239', name: 'Chicken Breast', category: 'Meat', price: 8.7, costPrice: 6.2, stock: 10, reorderLevel: 15, warehouseId: 'WH-AIRPORT', warehouse: 'Airport Branch', status: 'Low Stock' },
  { id: 6, sku: 'PRD-1298', name: 'Orange Juice', category: 'Beverages', price: 4.6, costPrice: 2.9, stock: 34, reorderLevel: 20, warehouseId: 'WH-RIVERSIDE', warehouse: 'Riverside Store', status: 'In Stock' },
  { id: 7, sku: 'PRD-1345', name: 'Tomato Sauce', category: 'Canned Goods', price: 2.4, costPrice: 1.4, stock: 29, reorderLevel: 15, warehouseId: 'WH-NORTH', warehouse: 'North Hub', status: 'In Stock' },
  { id: 8, sku: 'PRD-1412', name: 'Shampoo 500ml', category: 'Personal Care', price: 6.1, costPrice: 4.4, stock: 9, reorderLevel: 12, warehouseId: 'WH-DOWNTOWN', warehouse: 'Downtown Store', status: 'Low Stock' },
  { id: 9, sku: 'PRD-1502', name: 'Frozen Veg Mix', category: 'Frozen', price: 5.8, costPrice: 3.7, stock: 27, reorderLevel: 16, warehouseId: 'WH-AIRPORT', warehouse: 'Airport Branch', status: 'In Stock' },
  { id: 10, sku: 'PRD-1548', name: 'Detergent 2L', category: 'Household', price: 7.2, costPrice: 4.9, stock: 19, reorderLevel: 14, warehouseId: 'WH-CENTRAL', warehouse: 'Central Warehouse', status: 'In Stock' },
];

export const inventoryAlerts = [
  { item: 'Whole Wheat Bread', location: 'Downtown Store', current: 16, reorder: 18 },
  { item: 'Chicken Breast', location: 'Airport Branch', current: 10, reorder: 15 },
  { item: 'Shampoo 500ml', location: 'Downtown Store', current: 9, reorder: 12 },
  { item: 'Tomato Sauce', location: 'North Hub', current: 12, reorder: 15 },
];

export const inventoryMoves = [
  { name: 'Stock received', item: 'Rice 5kg', qty: '+32', time: '08:40 AM', status: 'Completed', warehouse: 'Central Warehouse' },
  { name: 'Damaged goods', item: 'Milk 1L', qty: '-6', time: '09:15 AM', status: 'Reviewed', warehouse: 'Central Warehouse' },
  { name: 'Transfer', item: 'Bananas', qty: '+18', time: '10:05 AM', status: 'In Transit', warehouse: 'City Center' },
  { name: 'Cycle count', item: 'Orange Juice', qty: '+12', time: '11:20 AM', status: 'Approved', warehouse: 'Riverside Store' },
];

export const customers = [
  { id: 1, name: 'Aisha Rahman', phone: '+1 (415) 555-0182', spend: 1842.5, visits: 28, tier: 'Gold', loyalty: 960 },
  { id: 2, name: 'Daniel Lee', phone: '+1 (612) 555-0173', spend: 1256.2, visits: 17, tier: 'Silver', loyalty: 610 },
  { id: 3, name: 'Marta Gomez', phone: '+1 (310) 555-0138', spend: 2410.1, visits: 31, tier: 'Platinum', loyalty: 1450 },
  { id: 4, name: 'Noah Patel', phone: '+1 (206) 555-0112', spend: 985.7, visits: 13, tier: 'Bronze', loyalty: 430 },
];

export const salesTransactions = [
  { id: 'INV-2048', customer: 'Aisha Rahman', itemCount: 12, amount: 94.4, channel: 'Card', status: 'Paid', warehouseId: 'WH-DOWNTOWN', warehouse: 'Downtown Store', cashier: 'Maya Khan' },
  { id: 'INV-2049', customer: 'Daniel Lee', itemCount: 7, amount: 61.8, channel: 'Cash', status: 'Paid', warehouseId: 'WH-CITY', warehouse: 'City Center', cashier: 'Liam James' },
  { id: 'INV-2050', customer: 'Walk-in', itemCount: 5, amount: 42.5, channel: 'Card', status: 'Pending', warehouseId: 'WH-AIRPORT', warehouse: 'Airport Branch', cashier: 'Nadia Shah' },
  { id: 'INV-2051', customer: 'Marta Gomez', itemCount: 18, amount: 136.9, channel: 'Wallet', status: 'Paid', warehouseId: 'WH-RIVERSIDE', warehouse: 'Riverside Store', cashier: 'Sara Khan' },
  { id: 'INV-2052', customer: 'Noah Patel', itemCount: 9, amount: 71.3, channel: 'Card', status: 'Refunded', warehouseId: 'WH-NORTH', warehouse: 'North Hub', cashier: 'Omar Ali' },
  { id: 'INV-2053', customer: 'Aisha Rahman', itemCount: 14, amount: 118.4, channel: 'Bank Transfer', status: 'Paid', warehouseId: 'WH-CENTRAL', warehouse: 'Central Warehouse', cashier: 'Jin Park' },
  { id: 'INV-2054', customer: 'Walk-in', itemCount: 6, amount: 57.2, channel: 'Cash', status: 'Paid', warehouseId: 'WH-DOWNTOWN', warehouse: 'Downtown Store', cashier: 'Maya Khan' },
];

export const salesOverview = [
  { label: 'Gross Sales', value: '$18.4K', trend: '+12.4%' },
  { label: 'Avg. Basket', value: '$42.30', trend: '+5.8%' },
  { label: 'Orders', value: '409', trend: '+9.1%' },
  { label: 'Returns', value: '12', trend: '-2.3%' },
];

export const posCatalog = [
  { id: 1, name: 'Fresh Milk 1L', price: 3.2 },
  { id: 2, name: 'Whole Wheat Bread', price: 2.8 },
  { id: 3, name: 'Bananas', price: 1.9 },
  { id: 4, name: 'Rice 5kg', price: 12.5 },
  { id: 5, name: 'Chicken Breast', price: 8.7 },
  { id: 6, name: 'Orange Juice', price: 4.6 },
  { id: 7, name: 'Tomato Sauce', price: 2.4 },
  { id: 8, name: 'Shampoo 500ml', price: 6.1 },
];

export const expenseRecords = [
  { id: 'EXP-1014', category: 'Rent', amount: 2800, warehouse: 'Central Warehouse', warehouseId: 'WH-CENTRAL', department: 'Operations', method: 'Bank Transfer', employee: 'R. Khan', date: '2025-04-22', status: 'Approved', description: 'Monthly warehouse rent' },
  { id: 'EXP-1015', category: 'Utilities', amount: 860, warehouse: 'Downtown Store', warehouseId: 'WH-DOWNTOWN', department: 'Store Ops', method: 'Cash', employee: 'L. James', date: '2025-04-23', status: 'Pending', description: 'Power and internet' },
  { id: 'EXP-1016', category: 'Maintenance', amount: 1240, warehouse: 'Airport Branch', warehouseId: 'WH-AIRPORT', department: 'Repair', method: 'Card', employee: 'M. Shah', date: '2025-04-24', status: 'Approved', description: 'Refrigeration maintenance' },
  { id: 'EXP-1017', category: 'Transportation', amount: 690, warehouse: 'North Hub', warehouseId: 'WH-NORTH', department: 'Logistics', method: 'Bank Transfer', employee: 'S. Patel', date: '2025-04-25', status: 'Reviewed', description: 'Delivery fuel and maintenance' },
  { id: 'EXP-1018', category: 'Other', amount: 430, warehouse: 'Central Warehouse', warehouseId: 'WH-CENTRAL', department: 'Operations', method: 'Cash', employee: 'J. Cole', date: '2025-04-26', status: 'Approved', description: 'Cleaning materials' },
  { id: 'EXP-1019', category: 'Electricity', amount: 960, warehouse: 'Central Warehouse', warehouseId: 'WH-CENTRAL', department: 'Facilities', method: 'Bank Transfer', employee: 'H. Ahmed', date: '2025-04-27', status: 'Pending', description: 'Monthly power charges' },
  { id: 'EXP-1020', category: 'Maintenance', amount: 1325, warehouse: 'Downtown Store', warehouseId: 'WH-DOWNTOWN', department: 'Repair', method: 'Card', employee: 'N. Thomas', date: '2025-04-27', status: 'Approved', description: 'HVAC servicing' },
];

export const stockTransferRecords = [
  {
    id: 'TR-1042',
    product: 'Fresh Milk 1L',
    from: 'Central Warehouse',
    to: 'Downtown Store',
    warehouseIdFrom: 'WH-CENTRAL',
    warehouseIdTo: 'WH-DOWNTOWN',
    qty: 180,
    value: 514,
    requestedBy: 'Maya Khan',
    status: 'Approved',
    movedAt: '2026-05-15',
    priority: 'Normal',
  },
  {
    id: 'TR-1047',
    product: 'Rice 5kg',
    from: 'North Hub',
    to: 'City Center',
    warehouseIdFrom: 'WH-NORTH',
    warehouseIdTo: 'WH-CITY',
    qty: 72,
    value: 912,
    requestedBy: 'Ahmed Ali',
    status: 'In Transit',
    movedAt: '2026-05-15',
    priority: 'High',
  },
  {
    id: 'TR-1053',
    product: 'Chicken Breast',
    from: 'Central Warehouse',
    to: 'Airport Branch',
    warehouseIdFrom: 'WH-CENTRAL',
    warehouseIdTo: 'WH-AIRPORT',
    qty: 58,
    value: 502,
    requestedBy: 'Noah Patel',
    status: 'Pending',
    movedAt: '2026-05-14',
    priority: 'Urgent',
  },
  {
    id: 'TR-1059',
    product: 'Orange Juice',
    from: 'City Center',
    to: 'Riverside Store',
    warehouseIdFrom: 'WH-CITY',
    warehouseIdTo: 'WH-RIVERSIDE',
    qty: 96,
    value: 440,
    requestedBy: 'Sara Khan',
    status: 'Completed',
    movedAt: '2026-05-13',
    priority: 'Normal',
  },
  {
    id: 'TR-1061',
    product: 'Tomato Sauce',
    from: 'North Hub',
    to: 'Downtown Store',
    warehouseIdFrom: 'WH-NORTH',
    warehouseIdTo: 'WH-DOWNTOWN',
    qty: 184,
    value: 442,
    requestedBy: 'Mateo Silva',
    status: 'Rejected',
    movedAt: '2026-05-12',
    priority: 'Low',
  },
  {
    id: 'TR-1066',
    product: 'Bread Loaf',
    from: 'Downtown Store',
    to: 'Central Warehouse',
    warehouseIdFrom: 'WH-DOWNTOWN',
    warehouseIdTo: 'WH-CENTRAL',
    qty: 240,
    value: 680,
    requestedBy: 'Lucy Gomez',
    status: 'Completed',
    movedAt: '2026-05-11',
    priority: 'Normal',
  },
  {
    id: 'TR-1071',
    product: 'Detergent 2L',
    from: 'Central Warehouse',
    to: 'Riverside Store',
    warehouseIdFrom: 'WH-CENTRAL',
    warehouseIdTo: 'WH-RIVERSIDE',
    qty: 136,
    value: 788,
    requestedBy: 'Imran Yusuf',
    status: 'Approved',
    movedAt: '2026-05-10',
    priority: 'High',
  },
  {
    id: 'TR-1078',
    product: 'Frozen Veg Mix',
    from: 'Airport Branch',
    to: 'North Hub',
    warehouseIdFrom: 'WH-AIRPORT',
    warehouseIdTo: 'WH-NORTH',
    qty: 94,
    value: 603,
    requestedBy: 'Hania Ali',
    status: 'In Transit',
    movedAt: '2026-05-09',
    priority: 'Normal',
  },
];

export const salesTrend = [42, 58, 74, 66, 88, 95, 118, 132, 126, 144, 152, 176];

export const categoryPerformance = [
  { name: 'Fresh Produce', value: 31 },
  { name: 'Bakery', value: 18 },
  { name: 'Household', value: 15 },
  { name: 'Beverages', value: 14 },
  { name: 'Meat', value: 12 },
  { name: 'Frozen', value: 10 },
];

export const productPerformance = [
  { name: 'Fresh Milk 1L', sales: 240 },
  { name: 'Rice 5kg', sales: 188 },
  { name: 'Chicken Breast', sales: 171 },
  { name: 'Orange Juice', sales: 162 },
  { name: 'Bread', sales: 151 },
  { name: 'Tomato Sauce', sales: 129 },
];

export const warehousePerformanceData = warehouseCatalog.map((warehouse) => ({
  warehouse: warehouse.name,
  revenue: warehouse.sales,
  margin: warehouse.sales > 0 ? Number(((warehouse.sales - warehouse.purchases) / warehouse.sales * 100).toFixed(1)) : 0,
  orders: warehouse.sales / 15,
  stockValue: warehouse.stockValue,
}));

export const financialDashboardData = {
  pAndLRows: [
    { label: 'Revenue', value: salesTransactions.reduce((sum, item) => sum + item.amount, 0) * 1000, type: 'income' },
    { label: 'Discounts & returns', value: 18470, type: 'expense' },
    { label: 'Cost of goods sold', value: 118900, type: 'expense' },
    { label: 'Gross profit', value: 63500, type: 'income' },
    { label: 'Operating expenses', value: 24100, type: 'expense' },
    { label: 'Taxes', value: 8360, type: 'expense' },
    { label: 'Net profit', value: 39400, type: 'income' },
  ],
  cashFlow: [
    { month: 'Jan', inflow: 52, outflow: 39 },
    { month: 'Feb', inflow: 58, outflow: 42 },
    { month: 'Mar', inflow: 63, outflow: 45 },
    { month: 'Apr', inflow: 72, outflow: 48 },
    { month: 'May', inflow: 86, outflow: 52 },
    { month: 'Jun', inflow: 94, outflow: 57 },
    { month: 'Jul', inflow: 102, outflow: 60 },
  ],
  warehouseMetrics: warehouseCatalog.map((warehouse) => ({
    name: warehouse.name,
    revenue: warehouse.sales,
    expenses: warehouse.purchases,
    profit: warehouse.sales - warehouse.purchases,
    cashFlow: Math.round(warehouse.sales * 0.33),
  })),
};

export function getWarehouseById(warehouseId) {
  return warehouseCatalog.find((warehouse) => warehouse.id === warehouseId) || null;
}

export function getWarehouseName(warehouseId) {
  return getWarehouseById(warehouseId)?.name || 'Unknown Warehouse';
}
