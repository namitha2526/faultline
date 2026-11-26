import json

def inspect_duplicates():
    with open('data/netbeans_stacktraces.json', 'r', encoding='utf-8') as f:
        chunk = f.read(2000000) # 2MB

    dec = json.JSONDecoder()
    pos = 1 if chunk.startswith('[') else 0
    records = []
    while pos < len(chunk):
        while pos < len(chunk) and chunk[pos] in ' \r\n\t,':
            pos += 1
        if pos >= len(chunk) or chunk[pos] == ']':
            break
        try:
            obj, end = dec.raw_decode(chunk, pos)
            records.append(obj)
            pos = end
        except json.JSONDecodeError:
            break

    print(f"Loaded {len(records)} records from sample.")
    # Find records that have a dup_id
    dups = [r for r in records if r.get("dup_id") is not None]
    print(f"Records with dup_id in this sample: {len(dups)}")
    for r in dups[:3]:
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
    inspect_duplicates()

