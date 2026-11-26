import json
import os
import sys

def analyze():
    filepath = 'data/netbeans_stacktraces.json'
    print(f"Analyzing {filepath}...")
    file_size_gb = os.path.getsize(filepath) / (1024**3)
    print(f"File size: {file_size_gb:.2f} GB")

    total_records = 0
    with_stacktrace = 0
    with_dup_id = 0
    resolutions = {}
    dup_map = {} # bug_id -> dup_id

    # Stream parser with chunking
    dec = json.JSONDecoder()
    with open(filepath, 'r', encoding='utf-8') as f:
        buffer = ""
        # Find start '['
        ch = f.read(1)
        while ch and ch != '[':
            ch = f.read(1)

        while True:
            chunk = f.read(1024 * 1024 * 8) # 8MB chunks
            if not chunk:
                break
            buffer += chunk

            pos = 0
            while True:
                # skip whitespace / commas
                while pos < len(buffer) and buffer[pos] in ' \r\n\t,':
                    pos += 1
                if pos >= len(buffer):
                    buffer = ""
                    break
                if buffer[pos] == ']':
                    pos += 1
                    buffer = ""
                    break

                try:
                    obj, end_pos = dec.raw_decode(buffer, pos)
                    pos = end_pos
                    total_records += 1

                    bug_id = obj.get("bug_id")
                    dup_id = obj.get("dup_id")
                    res = obj.get("resolution")
                    st = obj.get("stacktrace")

                    resolutions[res] = resolutions.get(res, 0) + 1
                    if st and len(st) > 0:
                        with_stacktrace += 1
                    if dup_id is not None:
                        with_dup_id += 1
                        dup_map[bug_id] = dup_id

                    if total_records % 10000 == 0:
                        print(f"Processed {total_records} records... (with stacktrace: {with_stacktrace}, with dup_id: {with_dup_id})")

                except json.JSONDecodeError:
                    # Incomplete JSON object at end of buffer
                    buffer = buffer[pos:]
                    break

    print("\n--- Summary ---")
    print("Total records:", total_records)
    print("With stacktrace:", with_stacktrace)
    print("With dup_id:", with_dup_id)
    print("Resolutions top 10:", sorted(resolutions.items(), key=lambda x: x[1], reverse=True)[:10])

if __name__ == "__main__":
    analyze()

