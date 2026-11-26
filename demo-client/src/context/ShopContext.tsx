import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product, MOCK_PRODUCTS } from "../mock/products";
import { MockUser, MOCK_USERS } from "../mock/users";
import { MockOrder, MOCK_ORDERS } from "../mock/orders";
import { Faultline } from "../faultline";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface ShopContextType {
  products: Product[];
  currentUser: MockUser | null;
  cart: CartItem[];
  orders: MockOrder[];
  couponCode: string | null;
  couponDiscount: number;
  cartSubtotal: number;
  cartTotal: number;
  setCurrentUser: (user: MockUser | null) => void;
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => Promise<void>;
  placeOrder: (paymentMethod: "card" | "upi" | "wallet") => Promise<MockOrder>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export const ShopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products] = useState<Product[]>(MOCK_PRODUCTS);
  const [currentUser, setCurrentUserState] = useState<MockUser | null>(MOCK_USERS[0]); // default Oliver Hughes
  const [cart, setCart] = useState<CartItem[]>([
    { product: MOCK_PRODUCTS[0], quantity: 1 },
    { product: MOCK_PRODUCTS[2], quantity: 1 },
  ]);
  const [orders, setOrders] = useState<MockOrder[]>(MOCK_ORDERS);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);

  // Sync user with Faultline SDK
  useEffect(() => {
    if (currentUser) {
      Faultline.setUser({ id: currentUser.id });
    } else {
      Faultline.setUser(null);
    }
  }, [currentUser]);

  const setCurrentUser = (user: MockUser | null) => {
    setCurrentUserState(user);
  };

  const addToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCouponCode(null);
    setCouponDiscount(0);
  };

  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const cartTotal = Math.max(0, cartSubtotal - couponDiscount);

  const applyCoupon = async (code: string): Promise<boolean> => {
    await new Promise((res) => setTimeout(res, 250));
    const upper = code.trim().toUpperCase();
    if (upper === "FAULTLINE10") {
      setCouponCode("FAULTLINE10");
      setCouponDiscount(10.0);
      return true;
    }
    if (upper === "SUMMER25") {
      setCouponCode("SUMMER25");
      setCouponDiscount(25.0);
      return true;
    }
    return false;
  };

  const removeCoupon = async (): Promise<void> => {
    await new Promise((res) => setTimeout(res, 150));
    setCouponCode(null);
    setCouponDiscount(0);
  };

  const placeOrder = async (
    paymentMethod: "card" | "upi" | "wallet"
  ): Promise<MockOrder> => {
    await new Promise((res) => setTimeout(res, 300));
    const newOrder: MockOrder = {
      id: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: currentUser?.id || "guest",
      date: "Today",
      status: "Processing",
      total: Number(cartTotal.toFixed(2)),
      trackingNumber: `GB-FL-${Math.floor(10000000 + Math.random() * 90000000)}`,
      items: cart.map((i) => ({
        id: i.product.id,
        name: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        image: i.product.image,
      })),
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    return newOrder;
  };

  return (
    <ShopContext.Provider
      value={{
        products,
        currentUser,
        cart,
        orders,
        couponCode,
        couponDiscount,
        cartSubtotal,
        cartTotal,
        setCurrentUser,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
        placeOrder,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = (): ShopContextType => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
};

