import hashlib
import re
from typing import Optional


def normalize_message(message: Optional[str]) -> str:
    """Strip out dynamic values like hex IDs, UUIDs, numbers, and timestamps from error messages."""
    if not message:
        return ""
    msg = message.strip()
    # Replace UUIDs
    msg = re.sub(
        r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}",
        "<UUID>",
        msg,
    )
    # Replace hex addresses / hashes
    msg = re.sub(r"0x[0-9a-fA-F]+", "<ADDR>", msg)
    msg = re.sub(r"\b[0-9a-fA-F]{16,64}\b", "<HASH>", msg)
    # Replace standalone numbers
    msg = re.sub(r"\b\d+\b", "<NUM>", msg)
    return msg


def normalize_frame_line(line: str) -> Optional[str]:
    """
    Extract filename/module and function name from a stack trace line,
    ignoring line and column numbers (Sentry grouping principle).
    Supports Python, JavaScript (V8, WebKit, SpiderMonkey), and generic formats.
    """
    line = line.strip()
    if not line:
        return None

    # JS V8 format: "at functionName (https://example.com/assets/app.js:123:45)"
    # or "at https://example.com/assets/app.js:123:45"
    m_v8 = re.match(r"^at\s+(?:(?P<fn>[^\s(]+)\s+)?\(?(?P<loc>[^)]+)\)?", line)
    if m_v8:
        fn = m_v8.group("fn") or "<anonymous>"
        loc = m_v8.group("loc")
        # Strip line and column numbers (:12:34)
        loc_clean = re.sub(r":\d+(?::\d+)?$", "", loc)
        # Strip URL protocol and query strings
        loc_clean = re.sub(r"^[a-zA-Z]+://[^/]+/", "/", loc_clean)
        loc_clean = re.sub(r"\?.*$", "", loc_clean)
        return f"{fn}@{loc_clean}"

    # Python format: 'File "/path/to/module.py", line 42, in my_func'
    m_py = re.match(r'^File\s+"(?P<file>[^"]+)",\s+line\s+\d+,\s+in\s+(?P<fn>.+)', line)
    if m_py:
        fn = m_py.group("fn")
        file_path = m_py.group("file").split("/")[-1].split("\\")[-1]
        return f"{fn}@{file_path}"

    # JS Firefox / Safari format: "functionName@https://domain.com/app.js:123:45"
    m_ff = re.match(r"^(?P<fn>[^@]*)@(?P<loc>.*)", line)
    if m_ff:
        fn = m_ff.group("fn") or "<anonymous>"
        loc = m_ff.group("loc")
        loc_clean = re.sub(r":\d+(?::\d+)?$", "", loc)
        loc_clean = re.sub(r"^[a-zA-Z]+://[^/]+/", "/", loc_clean)
        loc_clean = re.sub(r"\?.*$", "", loc_clean)
        return f"{fn}@{loc_clean}"

    # Generic frame fallback: strip numbers, keep keywords
    cleaned = re.sub(r":\d+(?::\d+)?", "", line)
    cleaned = re.sub(r"line\s+\d+", "", cleaned, flags=re.IGNORECASE)
    return cleaned.strip()


def compute_stack_hash(
    exception_type: Optional[str],
    message: Optional[str],
    stack_trace: Optional[str],
) -> str:
    """
    Computes a deterministic hash for error grouping similar to Sentry's default grouping algorithm.
    Prioritizes normalized stack frames. Fallback to exception_type + normalized message.
    """
    components = []
    exc = (exception_type or "").strip()
    if exc:
        components.append(f"exc:{exc}")

    normalized_frames = []
    if stack_trace:
        lines = stack_trace.strip().splitlines()
        for line in lines:
            norm = normalize_frame_line(line)
            if norm:
                normalized_frames.append(norm)

    if normalized_frames:
        components.append("frames:" + "|".join(normalized_frames))
    else:
        # Fallback to normalized message if no valid frames found
        norm_msg = normalize_message(message)
        components.append(f"msg:{norm_msg}")

    payload_signature = "||".join(components)
    return hashlib.sha256(payload_signature.encode("utf-8")).hexdigest()
