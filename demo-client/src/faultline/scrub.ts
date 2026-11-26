/**
 * PII and Secret Scrubber:
 * Redacts email addresses, credit card numbers, and auth tokens from error
 * messages and stack traces before sending to Faultline.
 */

// Credit card regex (13-16 digits with optional spaces or dashes)
const CREDIT_CARD_REGEX = /\b(?:\d[ -]*?){13,16}\b/g;

// Email address regex
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

// JWT Token regex
const JWT_REGEX = /\beyJ[a-zA-Z0-9_\-\.]{15,}\b/g;

// Bearer & API key pattern
const BEARER_KEY_REGEX = /\b(?:Bearer\s+|api[_-]?key[:=]\s*)[a-zA-Z0-9_\-\.]{16,}\b/gi;

export function scrubText(text: string | null | undefined): string {
  if (!text) return "";
  let result = text;
  try {
    result = result.replace(CREDIT_CARD_REGEX, "[REDACTED_CREDIT_CARD]");
    result = result.replace(EMAIL_REGEX, "[REDACTED_EMAIL]");
    result = result.replace(JWT_REGEX, "[REDACTED_JWT]");
    result = result.replace(BEARER_KEY_REGEX, "[REDACTED_TOKEN]");
  } catch {
    // Never fail during scrubbing
  }
  return result;
}

