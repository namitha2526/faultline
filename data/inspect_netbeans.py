import sys
import json

def inspect():
    with open('data/netbeans_stacktraces.json', 'r', encoding='utf-8') as f:
        chunk = f.read(200000)
    print("Chunk length read:", len(chunk))
    dec = json.JSONDecoder()
    pos = 1 if chunk.startswith('[') else 0
    records = []
    for _ in range(5):
        while pos < len(chunk) and chunk[pos] in ' \r\n\t,':
            pos += 1
        if pos >= len(chunk):
            break
        obj, end = dec.raw_decode(chunk, pos)
        records.append(obj)
        pos = end

    print(f"Parsed {len(records)} records.")
    for i, r in enumerate(records):
        print(f"\n--- RECORD {i} ---")
        print("bug_id:", r.get("bug_id"))
        print("dup_id:", r.get("dup_id"))
        print("resolution:", r.get("resolution"))
        print("product:", r.get("product"))
        print("component:", r.get("component"))
        print("short_desc:", r.get("short_desc"))
        print("description prefix:", repr(r.get("description", "")[:100]))
        st = r.get("stacktrace")
        print("stacktrace type:", type(st), "length:", len(st) if isinstance(st, list) else None)
        if isinstance(st, list) and len(st) > 0:
            print("first exception:", st[0].get("exception"))
            print("first message:", st[0].get("message"))
            frames = st[0].get("frames", [])
            print("frames count:", len(frames))
            if frames:
                print("frame 0:", frames[0])
                if len(frames) > 1:
                    print("frame 1:", frames[1])

if __name__ == "__main__":
    inspect()

