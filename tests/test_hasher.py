from app.core.hasher import compute_stack_hash, normalize_message


def test_hasher_identical_frames_different_lines():
    """Different line numbers and column numbers must result in identical hash (Sentry behavior)."""
    stack_v1 = (
        "    at validateSession (https://app.faultline.io/auth.ts:42:10)\n"
        "    at handleLogin (https://app.faultline.io/login.ts:89:12)"
    )
    stack_v2 = (
        "    at validateSession (https://app.faultline.io/auth.ts:55:20)\n"
        "    at handleLogin (https://app.faultline.io/login.ts:97:15)"
    )

    hash1 = compute_stack_hash("TypeError", "Cannot read properties of null", stack_v1)
    hash2 = compute_stack_hash("TypeError", "Cannot read properties of null", stack_v2)

    assert hash1 == hash2


def test_hasher_different_frames_produce_different_hashes():
    """Different call stacks produce distinct hashes."""
    stack_a = "    at checkoutCharge (https://app.faultline.io/stripe.ts:12:4)"
    stack_b = "    at uploadAvatar (https://app.faultline.io/upload.ts:12:4)"

    hash_a = compute_stack_hash("Error", "Failed", stack_a)
    hash_b = compute_stack_hash("Error", "Failed", stack_b)

    assert hash_a != hash_b


def test_hasher_normalizes_dynamic_message_tokens():
    """Dynamic UUIDs and numbers are replaced so varying error messages normalize."""
    msg1 = "Failed to load user 12345 with session 12345678-1234-5678-1234-567812345678"
    msg2 = "Failed to load user 99999 with session 87654321-4321-8765-4321-876543210987"

    norm1 = normalize_message(msg1)
    norm2 = normalize_message(msg2)

    assert norm1 == norm2
    assert norm1 == "Failed to load user <NUM> with session <UUID>"
