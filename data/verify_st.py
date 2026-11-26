import json

def verify_stacktrace_field():
    filepath = 'data/netbeans_stacktraces.json'
    dec = json.JSONDecoder()
    
    total = 0
    with_nonempty_st = 0
    with_frames = 0
    exceptions = {}
    
    with open(filepath, 'r', encoding='utf-8') as f:
        buffer = ""
        ch = f.read(1)
        while ch and ch != '[':
            ch = f.read(1)

        while True:
            chunk = f.read(1024 * 1024 * 8)
            if not chunk:
                break
            buffer += chunk

            pos = 0
            while True:
                while pos < len(buffer) and buffer[pos] in ' \r\n\t,':
                    pos += 1
                if pos >= len(buffer) or buffer[pos] == ']':
                    buffer = ""
                    break

                try:
                    obj, end_pos = dec.raw_decode(buffer, pos)
                    pos = end_pos
                    total += 1
                    st = obj.get("stacktrace")
                    if st and isinstance(st, list) and len(st) > 0:
                        with_nonempty_st += 1
                        first_st = st[0]
                        exc = first_st.get("exception")
                        if exc:
                            exceptions[exc] = exceptions.get(exc, 0) + 1
                        frames = first_st.get("frames", [])
                        if frames:
                            with_frames += 1
                except json.JSONDecodeError:
                    buffer = buffer[pos:]
                    break

    print(f"Total records: {total}")
    print(f"With non-empty stacktrace: {with_nonempty_st}")
    print(f"With frames: {with_frames}")
    print("Top 15 exceptions:", sorted(exceptions.items(), key=lambda x: x[1], reverse=True)[:15])

if __name__ == "__main__":
    verify_stacktrace_field()

