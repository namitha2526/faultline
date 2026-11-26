"""
Unit tests for Faultline Error Preprocessing Pipeline.
Includes explicit before-and-after test examples for:
- stripping dynamic UUIDs, user IDs, memory addresses, timestamps, and durations
- normalizing stack frames and stripping line/column numbers and file hashes
- preserving semantic exception type, clean messages, function names, and module paths
"""

from app.ml.preprocess import clean_frame, clean_message, clean_stack_trace, preprocess_error


def test_clean_message_strips_dynamic_tokens():
    """Before-and-after test for error message sanitization."""
    raw_message = (
        "TimeoutError: Request to payment capture endpoint timed out after 15000ms "
        "for user usr_9410 on session 12345678-1234-5678-1234-567812345678 "
        "at 2026-10-12T13:00:00Z (pointer 0x7ffee1234abc) order ord_4401"
    )

    cleaned = clean_message(raw_message)

    # Assert dynamic artifacts are stripped
    assert "usr_9410" not in cleaned
    assert "12345678-1234-5678-1234-567812345678" not in cleaned
    assert "2026-10-12T13:00:00Z" not in cleaned
    assert "0x7ffee1234abc" not in cleaned
    assert "15000ms" not in cleaned
    assert "ord_4401" not in cleaned

    # Assert semantic structure is preserved
    assert "TimeoutError: Request to payment capture endpoint timed out after" in cleaned
    assert "<DURATION>" in cleaned
    assert "<ID>" in cleaned
    assert "<UUID>" in cleaned
    assert "<TIMESTAMP>" in cleaned
    assert "<ADDR>" in cleaned


def test_clean_frame_v8_javascript():
    """Before-and-after test for V8 / Chrome / Node stack frame sanitization."""
    raw_line = "    at handleAuthCallback (https://app.faultline.io/src/controllers/authController.ts:89:12)"
    expected = "handleAuthCallback (src/controllers/authController.ts)"

    cleaned = clean_frame(raw_line)
    assert cleaned == expected


def test_clean_frame_strips_bundle_hashes():
    """Before-and-after test stripping webpack/vite chunk hashes."""
    raw_line = "    at renderProfile (https://app.faultline.io/assets/settings.a4f91c89.js:42:15)"
    expected = "renderProfile (assets/settings.js)"

    cleaned = clean_frame(raw_line)
    assert cleaned == expected


def test_clean_frame_python_format():
    """Before-and-after test for Python stack trace format."""
    raw_line = '  File "/app/services/payment_service.py", line 124, in process_charge'
    expected = "process_charge (payment_service.py)"

    cleaned = clean_frame(raw_line)
    assert cleaned == expected


def test_clean_frame_firefox_safari_format():
    """Before-and-after test for SpiderMonkey / WebKit stack format."""
    raw_line = "validateSessionCredentials@https://app.faultline.io/src/auth/session.ts:42:10"
    expected = "validateSessionCredentials (src/auth/session.ts)"

    cleaned = clean_frame(raw_line)
    assert cleaned == expected


def test_clean_stack_trace_deduplication_and_limit():
    """Ensures stack trace sanitization dedupes frames and bounds frame count."""
    trace = (
        "    at stepOne (https://domain.com/app.js:10:1)\n"
        "    at stepTwo (https://domain.com/app.js:20:2)\n"
        "    at stepOne (https://domain.com/app.js:15:1)\n"  # Duplicate function/module
        "    at stepThree (https://domain.com/app.js:30:3)\n"
    )

    frames = clean_stack_trace(trace, max_frames=2)
    assert len(frames) == 2
    assert frames[0] == "stepOne (app.js)"
    assert frames[1] == "stepTwo (app.js)"


def test_preprocess_error_complete_document():
    """Before-and-after verification for the full preprocessed document."""
    exc = "TypeError"
    msg = "Cannot read properties of null (reading 'id') for user usr_1049"
    stack = (
        "    at validateSessionCredentials (https://app.faultline.io/src/auth/sessionManager.ts:42:15)\n"
        "    at handleAuthCallback (https://app.faultline.io/src/controllers/authController.ts:89:12)"
    )

    doc = preprocess_error(exc, msg, stack)

    assert doc.startswith("TypeError: Cannot read properties of null (reading 'id') for user <ID>")
    assert "Frames:" in doc
    assert "validateSessionCredentials (src/auth/sessionManager.ts)" in doc
    assert "handleAuthCallback (src/controllers/authController.ts)" in doc
    assert ":42:15" not in doc
    assert ":89:12" not in doc
