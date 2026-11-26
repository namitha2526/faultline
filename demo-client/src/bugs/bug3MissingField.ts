import { Faultline } from "../faultline";

// Path A: Product card
function extractVariantPrice(variant: any): number {
  return variant.price * 1.2;
}

function computeDiscountedPrice(productMetadata: any): number {
  return extractVariantPrice(productMetadata.selectedVariant);
}

function renderProductCardItem(item: any): number {
  return computeDiscountedPrice(item);
}

export function triggerMissingPriceViaCard(): void {
  try {
    renderProductCardItem({ id: "prod_audio_01", title: "Wireless ANC Headphones", selectedVariant: undefined });
  } catch (err) {
    Faultline.captureException(err, { source: "Product card render" });
    throw err;
  }
}

// Path B: Cart total
function lookupItemUnitPrice(lineItem: any): number {
  return lineItem.productDetails.price;
}

function aggregateLineItemCosts(cartLines: any[]): number {
  return cartLines.reduce((sum, line) => sum + lookupItemUnitPrice(line), 0);
}

function calculateCartSubtotal(cart: any): number {
  return aggregateLineItemCosts(cart.items);
}

export function triggerMissingPriceViaCart(): void {
  try {
    calculateCartSubtotal({
      cartId: "cart_active_01",
      items: [{ id: "li_1", quantity: 2, productDetails: undefined }],
    });
  } catch (err) {
    Faultline.captureException(err, { source: "Cart total calculation" });
    throw err;
  }
}

// Path C: Order summary
function getOrderItemBasePrice(orderEntry: any): number {
  return orderEntry.unit.price;
}

function computeTaxBreakdown(orderSnapshot: any): number {
  return getOrderItemBasePrice(orderSnapshot.entry) * 0.2;
}

function generateOrderInvoice(orderPayload: any): number {
  return computeTaxBreakdown(orderPayload);
}

export function triggerMissingPriceViaOrderSummary(): void {
  try {
    generateOrderInvoice({ orderId: "ord_2026_994", entry: { unit: undefined } });
  } catch (err) {
    Faultline.captureException(err, { source: "Order summary invoice" });
    throw err;
  }
}

