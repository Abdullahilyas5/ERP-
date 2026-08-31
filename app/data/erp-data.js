export const productCatalog = [];

export const inventoryAlerts = [];

export const inventoryMoves = [];

export const customers = [
  { id: 1, name: 'Aisha Rahman', phone: '+1 (415) 555-0182', spend: 1842.5, visits: 28, tier: 'Gold', loyalty: 960 },
  { id: 2, name: 'Daniel Lee', phone: '+1 (612) 555-0173', spend: 1256.2, visits: 17, tier: 'Silver', loyalty: 610 },
  { id: 3, name: 'Marta Gomez', phone: '+1 (310) 555-0138', spend: 2410.1, visits: 31, tier: 'Platinum', loyalty: 1450 },
  { id: 4, name: 'Noah Patel', phone: '+1 (206) 555-0112', spend: 985.7, visits: 13, tier: 'Bronze', loyalty: 430 },
];

export const salesTransactions = [
  { id: 'INV-2048', customer: 'Aisha Rahman', itemCount: 12, amount: 94.4, channel: 'Card', status: 'Paid' },
  { id: 'INV-2049', customer: 'Daniel Lee', itemCount: 7, amount: 61.8, channel: 'Cash', status: 'Paid' },
  { id: 'INV-2050', customer: 'Walk-in', itemCount: 5, amount: 42.5, channel: 'Card', status: 'Pending' },
  { id: 'INV-2051', customer: 'Marta Gomez', itemCount: 18, amount: 136.9, channel: 'Wallet', status: 'Paid' },
  { id: 'INV-2052', customer: 'Noah Patel', itemCount: 9, amount: 71.3, channel: 'Card', status: 'Refunded' },
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
