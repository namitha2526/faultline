import { Faultline } from "../faultline";

// Path A: Add to cart
function assertWarehouseAllocation(sku: string, requested: number, available: number): void {
  throw new Error(`Stock mismatch: Item out of stock after add to cart: SKU ${sku} has ${available} remaining, cannot fulfill ${requested}`);
}

function verifyInventoryAvailability(sku: string, qty: number): void {
  assertWarehouseAllocation(sku, qty, 0);
}

function handleAddToCartAction(productId: string, quantity: number): void {
  verifyInventoryAvailability(`SKU-MODERN-AUDIO-${productId}`, quantity);
}

export function triggerStockMismatchViaAdd(): void {
  try {
    handleAddToCartAction("prod_audio_01", 1);
  } catch (err) {
    Faultline.captureException(err, { source: "Add to cart inventory check" });
    throw err;
  }
}

// Path B: Quantity update
function checkBinCapacity(binId: string, requestedQty: number): void {
  throw new Error(`Stock mismatch: Item out of stock after quantity update in warehouse bin ${binId}: stock count insufficient`);
}

function revalidateCartStock(cartId: string, itemId: string, newQty: number): void {
  checkBinCapacity("BIN_NORTH_RACK_4", newQty);
}

function updateCartQuantity(cartId: string, itemId: string, targetQuantity: number): void {
  revalidateCartStock(cartId, itemId, targetQuantity);
}

export function triggerStockMismatchViaQty(): void {
  try {
    updateCartQuantity("cart_9918", "li_headphones", 4);
  } catch (err) {
    Faultline.captureException(err, { source: "Quantity update inventory check" });
    throw err;
  }
}

// Path C: Checkout validation
function verifyFinalStockAvailability(reservationToken: string): void {
  throw new Error(`Stock mismatch: Item out of stock during checkout validation for reservation token ${reservationToken}`);
}

function lockInventoryReservation(orderId: string): void {
  verifyFinalStockAvailability(`res_${orderId}_expired`);
}

function finalizeOrderCommit(orderContext: any): void {
  lockInventoryReservation(orderContext.orderId);
}

export function triggerStockMismatchViaCheckout(): void {
  try {
    finalizeOrderCommit({ orderId: "ord_checkout_sync_02" });
  } catch (err) {
    Faultline.captureException(err, { source: "Checkout inventory commitment" });
    throw err;
  }
}

