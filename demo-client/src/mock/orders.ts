export interface MockOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface MockOrder {
  id: string;
  userId: string;
  date: string;
  status: "Delivered" | "In Transit" | "Processing";
  total: number;
  items: MockOrderItem[];
  trackingNumber: string;
}

export const MOCK_ORDERS: MockOrder[] = [
  {
    id: "ORD-2026-8819",
    userId: "usr_gb_oliver_101",
    date: "18 Nov 2026",
    status: "Delivered",
    total: 349.49,
    trackingNumber: "GB-RM-94810294",
    items: [
      {
        id: "prod-1",
        name: "AeroSound Pro Wireless ANC",
        price: 199.99,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600",
      },
      {
        id: "prod-2",
        name: "Apex Mechanical Keyboard",
        price: 149.50,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=600",
      },
    ],
  },
  {
    id: "ORD-2026-7731",
    userId: "usr_gb_oliver_101",
    date: "04 Oct 2026",
    status: "Delivered",
    total: 64.99,
    trackingNumber: "GB-DPD-11928471",
    items: [
      {
        id: "prod-3",
        name: "Lumina Desk Ambient Lightbar",
        price: 64.99,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&q=80&w=600",
      },
    ],
  },
  {
    id: "ORD-2026-9042",
    userId: "usr_gb_charlotte_102",
    date: "20 Nov 2026",
    status: "In Transit",
    total: 279.00,
    trackingNumber: "GB-RM-49102837",
    items: [
      {
        id: "prod-4",
        name: "Vantage Chrono Smartwatch",
        price: 279.00,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600",
      },
    ],
  },
  {
    id: "ORD-2026-6512",
    userId: "usr_gb_harry_103",
    date: "12 Nov 2026",
    status: "Processing",
    total: 159.00,
    trackingNumber: "GB-EVRI-3019827",
    items: [
      {
        id: "prod-12",
        name: "Canvas EDC Utility Backpack",
        price: 159.00,
        quantity: 1,
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600",
      },
    ],
  },
];

