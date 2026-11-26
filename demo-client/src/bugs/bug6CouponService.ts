import { Faultline } from "../faultline";

// Path A: Apply coupon
function dispatchVoucherRpc(voucherCode: string): void {
  throw new Error(`Third-party failure: Coupon service unreachable at https://promotions.internal.faultline.io/v1/apply?code=${voucherCode} (ECONNREFUSED)`);
}

function queryPromotionsService(code: string): void {
  dispatchVoucherRpc(code);
}

function handleApplyCoupon(discountCode: string): void {
  queryPromotionsService(discountCode);
}

export function triggerCouponUnreachableViaApply(): void {
  try {
    handleApplyCoupon("SUMMER25");
  } catch (err) {
    Faultline.captureException(err, { source: "Apply coupon RPC" });
    throw err;
  }
}

// Path B: Remove coupon
function notifyDiscountGateway(couponId: string): void {
  throw new Error(`Third-party failure: Coupon service unreachable while releasing promotional hold for ${couponId} (ETIMEDOUT after 10000ms)`);
}

function releasePromotionalHold(couponRecord: any): void {
  notifyDiscountGateway(couponRecord.id);
}

function handleRemoveCoupon(couponData: any): void {
  releasePromotionalHold(couponData);
}

export function triggerCouponUnreachableViaRemove(): void {
  try {
    handleRemoveCoupon({ id: "CPN_SPRING_SAVE" });
  } catch (err) {
    Faultline.captureException(err, { source: "Remove coupon discount gateway" });
    throw err;
  }
}

