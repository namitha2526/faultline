import {
  triggerNullUserViaAuth,
  triggerNullUserViaProfile,
  triggerNullUserViaCheckout,
} from "./bug1NullUser";
import {
  triggerCardPaymentTimeout,
  triggerUpiPaymentTimeout,
  triggerWalletPaymentTimeout,
} from "./bug2PaymentTimeout";
import {
  triggerMissingPriceViaCard,
  triggerMissingPriceViaCart,
  triggerMissingPriceViaOrderSummary,
} from "./bug3MissingField";
import {
  triggerJsonParseViaProducts,
  triggerJsonParseViaCart,
  triggerJsonParseViaOrders,
} from "./bug4JsonParse";
import {
  triggerStockMismatchViaAdd,
  triggerStockMismatchViaQty,
  triggerStockMismatchViaCheckout,
} from "./bug5StockMismatch";
import {
  triggerCouponUnreachableViaApply,
  triggerCouponUnreachableViaRemove,
} from "./bug6CouponService";

export interface BugPathDefinition {
  id: string;
  name: string;
  actionName: string;
  trigger: () => void;
}

export interface BugDefinition {
  id: string;
  name: string;
  rootCause: string;
  description: string;
  paths: BugPathDefinition[];
}

export const ALL_BUGS: BugDefinition[] = [
  {
    id: "bug-1",
    name: "1. Null User",
    rootCause: "TypeError: Cannot read properties of null (reading 'name')",
    description: "Accessing user.name when the user object is null in auth, profile, and checkout",
    paths: [
      {
        id: "bug-1-auth",
        name: "Login -> getProfile",
        actionName: "Trigger via Login",
        trigger: triggerNullUserViaAuth,
      },
      {
        id: "bug-1-profile",
        name: "Profile Page Render",
        actionName: "Trigger via Profile",
        trigger: triggerNullUserViaProfile,
      },
      {
        id: "bug-1-checkout",
        name: "Checkout Greeting Header",
        actionName: "Trigger via Checkout",
        trigger: triggerNullUserViaCheckout,
      },
    ],
  },
  {
    id: "bug-2",
    name: "2. Payment Timeout",
    rootCause: "Payment Timeout: Upstream gateway confirmation timed out after 30000ms",
    description: "Payment gateway requests time out across Card, UPI, and Digital Wallet methods",
    paths: [
      {
        id: "bug-2-card",
        name: "Credit / Debit Card Payment",
        actionName: "Trigger via Card",
        trigger: triggerCardPaymentTimeout,
      },
      {
        id: "bug-2-upi",
        name: "UPI VPA Authorization",
        actionName: "Trigger via UPI",
        trigger: triggerUpiPaymentTimeout,
      },
      {
        id: "bug-2-wallet",
        name: "Digital Wallet Debit",
        actionName: "Trigger via Wallet",
        trigger: triggerWalletPaymentTimeout,
      },
    ],
  },
  {
    id: "bug-3",
    name: "3. Missing Field",
    rootCause: "TypeError: Cannot read properties of undefined (reading 'price')",
    description: "Accessing price on an undefined product or cart item",
    paths: [
      {
        id: "bug-3-card",
        name: "Product Card Variant Price",
        actionName: "Trigger via Product Card",
        trigger: triggerMissingPriceViaCard,
      },
      {
        id: "bug-3-cart",
        name: "Cart Total Calculation",
        actionName: "Trigger via Cart Total",
        trigger: triggerMissingPriceViaCart,
      },
      {
        id: "bug-3-order",
        name: "Order Summary Invoice",
        actionName: "Trigger via Order Summary",
        trigger: triggerMissingPriceViaOrderSummary,
      },
    ],
  },
  {
    id: "bug-4",
    name: "4. Failed JSON Parse",
    rootCause: "SyntaxError: Unexpected token in JSON response",
    description: "Upstream endpoints return HTML error pages or truncated payloads",
    paths: [
      {
        id: "bug-4-products",
        name: "Loading Products Catalog (502 HTML)",
        actionName: "Trigger via Products",
        trigger: triggerJsonParseViaProducts,
      },
      {
        id: "bug-4-cart",
        name: "Loading Remote Cart (Truncated JSON)",
        actionName: "Trigger via Cart State",
        trigger: triggerJsonParseViaCart,
      },
      {
        id: "bug-4-orders",
        name: "Loading Orders ('undefined' JSON)",
        actionName: "Trigger via Order History",
        trigger: triggerJsonParseViaOrders,
      },
    ],
  },
  {
    id: "bug-5",
    name: "5. Stock Mismatch",
    rootCause: "InventoryError: Item out of stock after cart mutation or checkout",
    description: "Warehouse inventory depletion occurs during add to cart, qty update, or checkout",
    paths: [
      {
        id: "bug-5-add",
        name: "Add to Cart Inventory Check",
        actionName: "Trigger via Add to Cart",
        trigger: triggerStockMismatchViaAdd,
      },
      {
        id: "bug-5-qty",
        name: "Quantity Update Check",
        actionName: "Trigger via Qty Update",
        trigger: triggerStockMismatchViaQty,
      },
      {
        id: "bug-5-checkout",
        name: "Checkout Validation Commitment",
        actionName: "Trigger via Checkout Commit",
        trigger: triggerStockMismatchViaCheckout,
      },
    ],
  },
  {
    id: "bug-6",
    name: "6. Third-Party Failure",
    rootCause: "ServiceUnavailableError: Coupon service unreachable at api.promotions.internal",
    description: "External promotion microservice is down with connection refused or timeout",
    paths: [
      {
        id: "bug-6-apply",
        name: "Apply Coupon RPC (ECONNREFUSED)",
        actionName: "Trigger via Apply Coupon",
        trigger: triggerCouponUnreachableViaApply,
      },
      {
        id: "bug-6-remove",
        name: "Remove Coupon Gateway (ETIMEDOUT)",
        actionName: "Trigger via Remove Coupon",
        trigger: triggerCouponUnreachableViaRemove,
      },
    ],
  },
];

