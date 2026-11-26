import json

def compare_pair(target_ids):
    filepath = 'data/netbeans_stacktraces.json'
    dec = json.JSONDecoder()
    found = {}
    with open(filepath, 'r', encoding='utf-8') as f:
        buffer = ""
        ch = f.read(1)
        while ch and ch != '[':
            ch = f.read(1)

        while len(found) < len(target_ids):
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
                    bid = obj.get("bug_id")
                    if bid in target_ids:
                        found[bid] = obj
                        if len(found) >= len(target_ids):
                            break
                except json.JSONDecodeError:
                    buffer = buffer[pos:]
                    break

    for bid, obj in found.items():
        print("\n===============================")
        print(f"Bug ID: {obj.get('bug_id')} -> Dup of: {obj.get('dup_id')}")
        print(f"Short desc: {obj.get('short_desc')}")
        st = obj.get("stacktrace", [])
        if st:
            entry = st[0]
            print(f"Exception: {entry.get('exception')}, Message: {entry.get('message')}")
            for f in entry.get("frames", [])[:5]:
                print(f"   at {f.get('function')}({f.get('file')}:{f.get('fileline')})")

if __name__ == "__main__":
    compare_pair({8766, 8811})

