"""
Faultline Preprocessing Pipeline
Prepares raw error events for semantic embedding generation by stripping:
- Line numbers & column numbers
- Memory addresses (e.g. 0x7fff...)
- Dynamic IDs (UUIDs, user IDs, session IDs, payment intent IDs)
- Timestamps and durations (e.g. 15000ms, 2026-10-12T13:00:00Z)
- File / asset / git bundle hashes
- Hostnames and query parameters
Preserves:
- Exception type
- Normalized semantic error message
- Function / method names and module paths
"""

import re
from typing import Optional


def clean_message(message: Optional[str]) -> str:
    """Strip dynamic variables, identifiers, timestamps, and hashes from an error message."""
    if not message:
        return ""

    text = message.strip()

    # 1. Strip ISO Timestamps (e.g. 2026-10-12T13:00:00Z or 2026-10-12 14:00:00)
    text = re.sub(
        r"\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?",
        "<TIMESTAMP>",
        text,
    )

    # 2. Strip UUIDs
    text = re.sub(
        r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b",
        "<UUID>",
        text,
    )

    # 3. Strip memory addresses (0x...)
    text = re.sub(r"\b0x[0-9a-fA-F]+\b", "<ADDR>", text)

    # 4. Strip specific entity IDs (usr_1234, ord_5678, sess_9012, pi_3N..., etc.)
    text = re.sub(r"\b(usr|sess|ord|wgt|org|cust|acc|inv|txn|pi|tok)_[a-zA-Z0-9_-]+\b", "<ID>", text)

    # 5. Strip JWT tokens or long base64/hex strings
    text = re.sub(r"\beyJ[a-zA-Z0-9_\-\.]{10,}\b", "<JWT>", text)
    text = re.sub(r"\b[0-9a-fA-F]{16,64}\b", "<HASH>", text)

    # 6. Strip durations (15000ms, 15s, 3000ms, 5.2s)
    text = re.sub(r"\b\d+(?:\.\d+)?\s*(?:ms|milliseconds|sec|seconds|s)\b", "<DURATION>", text, flags=re.IGNORECASE)

    # 7. Strip file sizes (15MB, 15728640 bytes, 24.2MB)
    text = re.sub(r"\b\d+(?:\.\d+)?\s*(?:MB|KB|GB|bytes)\b", "<SIZE>", text, flags=re.IGNORECASE)

    # 8. Strip standalone numbers
    text = re.sub(r"\b\d+\b", "<NUM>", text)

    # Collapse multiple spaces
    text = re.sub(r"\s+", " ", text).strip()
    return text


def clean_frame(line: str) -> Optional[str]:
    """
    Parse a single stack trace line, removing line/column numbers and file hashes
    while keeping the function name and cleaned relative file/module name.
    """
    line = line.strip()
    if not line:
        return None

    # Strip URLs / protocols
    line = re.sub(r"https?://[^/]+/", "", line)
    # Strip URL query params
    line = re.sub(r"\?[^:)\s]+", "", line)

    # Strip file bundle hashes: e.g. "chunk.a4f91c89.js" -> "chunk.js"
    line = re.sub(r"\.[0-9a-fA-F]{6,16}\.(js|ts|mjs)", r".\1", line)

    # Match Chrome / Node / V8: "at functionName (path/file.ts:12:34)"
    m_v8 = re.match(r"^at\s+(?:(?P<fn>[^\s(]+)\s+)?\(?(?P<loc>[^)]+)\)?", line)
    if m_v8:
        fn = m_v8.group("fn") or "<anonymous>"
        loc = m_v8.group("loc")
        # Strip line & column numbers (:12:34 or :12)
        clean_loc = re.sub(r":\d+(?::\d+)?$", "", loc)
        return f"{fn} ({clean_loc})"

    # Match Python: 'File "/path/to/module.py", line 42, in my_func'
    m_py = re.match(r'^File\s+"(?P<file>[^"]+)",\s+line\s+\d+,\s+in\s+(?P<fn>.+)', line)
    if m_py:
        fn = m_py.group("fn").strip()
        file_path = m_py.group("file").split("/")[-1].split("\\")[-1]
        return f"{fn} ({file_path})"

    # Match Firefox / Safari: "functionName@path/file.ts:12:34"
    m_ff = re.match(r"^(?P<fn>[^@]*)@(?P<loc>.*)", line)
    if m_ff:
        fn = m_ff.group("fn") or "<anonymous>"
        loc = m_ff.group("loc")
        clean_loc = re.sub(r":\d+(?::\d+)?$", "", loc)
        return f"{fn} ({clean_loc})"

    # Fallback cleanup for generic frames
    generic = re.sub(r":\d+(?::\d+)?", "", line)
    generic = re.sub(r"line\s+\d+", "", generic, flags=re.IGNORECASE)
    generic = re.sub(r"\b0x[0-9a-fA-F]+\b", "", generic)
    return generic.strip() or None


def clean_stack_trace(stack_trace: Optional[str], max_frames: int = 6) -> list[str]:
    """Extract and sanitize normalized stack frames, keeping the top most relevant frames."""
    if not stack_trace:
        return []

    cleaned_frames = []
    for line in stack_trace.strip().splitlines():
        cf = clean_frame(line)
        if cf and cf not in cleaned_frames:
            cleaned_frames.append(cf)
            if len(cleaned_frames) >= max_frames:
                break

    return cleaned_frames


def preprocess_error(
    exception_type: Optional[str],
    message: Optional[str],
    stack_trace: Optional[str],
    max_frames: int = 6,
) -> str:
    """
    Transforms raw error details into a dense, clean semantic text document
    tailored for embedding generation.
    """
    exc = (exception_type or "").strip()
    msg = clean_message(message)
    frames = clean_stack_trace(stack_trace, max_frames=max_frames)

    parts = []
    if exc and msg:
        parts.append(f"{exc}: {msg}")
    elif exc:
        parts.append(exc)
    elif msg:
        parts.append(msg)
    else:
        parts.append("UnknownError")

    if frames:
        frames_text = " | ".join(frames)
        parts.append(f"Frames: {frames_text}")

    return "\n".join(parts)
