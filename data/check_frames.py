import json
import re

def check_real_frames():
    filepath = 'data/netbeans_stacktraces.json'
    dec = json.JSONDecoder()
    frame_samples = []
    
    with open(filepath, 'r', encoding='utf-8') as f:
        buffer = ""
        ch = f.read(1)
        while ch and ch != '[':
            ch = f.read(1)

        while len(frame_samples) < 20:
            chunk = f.read(1024 * 1024 * 2)
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
                    desc = obj.get("description", "")
                    for line in desc.splitlines():
                        if "at " in line:
                            frame_samples.append(line.strip())
                            if len(frame_samples) >= 20:
                                break
                except json.JSONDecodeError:
                    buffer = buffer[pos:]
                    break

    for s in frame_samples[:10]:
        print("SAMPLE FRAME:", s)

if __name__ == "__main__":
    check_real_frames()

