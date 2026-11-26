import json

def find_first_dups():
    filepath = 'data/netbeans_stacktraces.json'
    dec = json.JSONDecoder()
    dups = []
    with open(filepath, 'r', encoding='utf-8') as f:
        buffer = ""
        ch = f.read(1)
        while ch and ch != '[':
            ch = f.read(1)

        while len(dups) < 5:
            chunk = f.read(1024 * 1024 * 4)
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
                    if obj.get("dup_id") is not None:
                        dups.append(obj)
                        if len(dups) >= 5:
                            break
                except json.JSONDecodeError:
                    buffer = buffer[pos:]
                    break

    for r in dups:
        print("\n===============================")
        print(f"Bug ID: {r.get('bug_id')} -> Dup of: {r.get('dup_id')}")
        print(f"Short desc: {r.get('short_desc')}")
        print(f"Product: {r.get('product')}, Component: {r.get('component')}")
        st = r.get("stacktrace", [])
        print(f"Stacktrace entries: {len(st)}")
        for idx, entry in enumerate(st):
            print(f"  Entry {idx}: exc={entry.get('exception')}, msg={entry.get('message')}")
            frames = entry.get("frames", [])
            print(f"  Frames ({len(frames)}):")
            for f in frames[:4]:
                print(f"    {f.get('function')} ({f.get('file')}:{f.get('fileline')})")

if __name__ == "__main__":
    find_first_dups()

