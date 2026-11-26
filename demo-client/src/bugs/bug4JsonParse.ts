import { Faultline } from "../faultline";

// Path A: Loading products
function parseProductJsonStream(rawJson: string): any {
  return JSON.parse(rawJson);
}

function deserializeCatalogPayload(apiResponseBody: string): any {
  return parseProductJsonStream(apiResponseBody);
}

function fetchRemoteProductCatalog(endpoint: string): any {
  const upstream502Body = "<html><head><title>502 Bad Gateway</title></head><body><h1>502 Bad Gateway</h1>Cloudflare</body></html>";
  return deserializeCatalogPayload(upstream502Body);
}

export function triggerJsonParseViaProducts(): void {
  try {
    fetchRemoteProductCatalog("/api/v1/products/featured");
  } catch (err) {
    Faultline.captureException(err, { source: "Loading products catalog" });
    throw err;
  }
}

// Path B: Loading cart
function decodeCartBlob(corruptedCartString: string): any {
  return JSON.parse(corruptedCartString);
}

function restorePersistedCart(cartStorageKey: string): any {
  const truncatedJson = '{"cart_id": "c_8831", "items": [{"id": 1, "name": "Watch", "qty":';
  return decodeCartBlob(truncatedJson);
}

function syncRemoteCartState(userId: string): any {
  return restorePersistedCart(`cart_${userId}`);
}

export function triggerJsonParseViaCart(): void {
  try {
    syncRemoteCartState("usr_charlotte");
  } catch (err) {
    Faultline.captureException(err, { source: "Loading cart state" });
    throw err;
  }
}

// Path C: Loading orders
function deserializeOrderReceipts(receiptPayload: string): any {
  return JSON.parse(receiptPayload);
}

function parseOrderHistoryResponse(rawPayload: string): any {
  return deserializeOrderReceipts(rawPayload);
}

function fetchHistoricalOrders(accountId: string): any {
  return parseOrderHistoryResponse("undefined");
}

export function triggerJsonParseViaOrders(): void {
  try {
    fetchHistoricalOrders("acc_oliver_88");
  } catch (err) {
    Faultline.captureException(err, { source: "Loading order history" });
    throw err;
  }
}

