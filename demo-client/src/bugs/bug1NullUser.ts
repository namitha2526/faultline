import { Faultline } from "../faultline";

// Path A: Login -> getProfile
function formatUserProfile(user: any): string {
  return `User: ${user.name.toUpperCase()}`;
}

function fetchUserProfile(authSession: any): string {
  const user = authSession?.user ?? null;
  return formatUserProfile(user);
}

function handleAuthCallback(token: string): string {
  const session = { token, user: null };
  return fetchUserProfile(session);
}

export function triggerNullUserViaAuth(): void {
  try {
    handleAuthCallback("session_tok_99182");
  } catch (err) {
    Faultline.captureException(err, { source: "Login -> getProfile" });
    throw err;
  }
}

// Path B: Profile page render
function buildUserGreeting(account: any): string {
  return `Welcome back, ${account.name}!`;
}

function getUserDisplayName(profileData: any): string {
  return buildUserGreeting(profileData?.user ?? null);
}

function renderProfileHeader(viewContext: any): string {
  return getUserDisplayName(viewContext);
}

export function triggerNullUserViaProfile(): void {
  try {
    renderProfileHeader({ view: "profile_settings", user: null });
  } catch (err) {
    Faultline.captureException(err, { source: "Profile page render" });
    throw err;
  }
}

// Path C: Checkout greeting header
function formatCustomerSalutation(customer: any): string {
  return `Shipping to ${customer.name}`;
}

function renderCheckoutBanner(checkoutContext: any): string {
  return formatCustomerSalutation(checkoutContext.customer);
}

function validateCheckoutSession(session: any): string {
  return renderCheckoutBanner({ customer: session.user });
}

export function triggerNullUserViaCheckout(): void {
  try {
    validateCheckoutSession({ sessionId: "chk_7721", user: null });
  } catch (err) {
    Faultline.captureException(err, { source: "Checkout greeting header" });
    throw err;
  }
}

