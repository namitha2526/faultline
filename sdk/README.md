# Faultline JavaScript SDK

A lightweight, zero-dependency browser SDK for Faultline that automatically captures runtime errors and unhandled promise rejections, posting them directly to the Faultline ingestion API.

## Quick Start

Include `faultline.js` in your HTML or bundle:

```html
<script src="faultline.js"></script>
<script>
  Faultline.init({
    apiKey: "YOUR_PROJECT_API_KEY",
    endpoint: "http://localhost:8000",
    release: "1.0.0",
    debug: false
  });
</script>
```

## Features

- **Automated Exception Capture**: Intercepts `window.onerror` and captures full stack traces, browser info, and OS metadata.
- **Unhandled Promise Rejections**: Intercepts `window.onunhandledrejection` across async workflows.
- **Manual Capture**:
  ```javascript
  Faultline.captureException(new Error("Custom failure context"), { userId: "usr_123" });
  Faultline.captureMessage("Rate limit exceeded on user profile", { userId: "usr_123" });
  ```
- **Deduplication**: Built-in 1000ms deduplication throttling for rapid cascaded errors.
- **Cross-Browser Normalization**: Automatically resolves browser signatures across Chrome, Safari, Firefox, and Edge.
