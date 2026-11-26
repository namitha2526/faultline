import json
from collections import defaultdict, Counter

def analyze_duplicates():
    filepath = 'data/netbeans_stacktraces.json'
    print(f"Reading {filepath} for duplicate graph analysis...")

    # We want to find:
    # 1. bug_id -> dup_id
    # 2. connected components of duplicates
    # 3. bug details (exception type, message, frames, stacktrace text)

    bug_to_dup = {}
    all_bugs = set()
    bug_records = {} # store a sample of metadata

    dec = json.JSONDecoder()
    with open(filepath, 'r', encoding='utf-8') as f:
        buffer = ""
        ch = f.read(1)
        while ch and ch != '[':
            ch = f.read(1)

        count = 0
        while True:
            chunk = f.read(1024 * 1024 * 8)
            if not chunk:
                break
            buffer += chunk

            pos = 0
            while True:
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
                    count += 1

                    bid = obj.get("bug_id")
                    did = obj.get("dup_id")
                    all_bugs.add(bid)
                    if did is not None:
                        bug_to_dup[bid] = did

                except json.JSONDecodeError:
                    buffer = buffer[pos:]
                    break

    print(f"Total bugs: {len(all_bugs)}")
    print(f"Bugs pointing to a dup_id: {len(bug_to_dup)}")

    # Build disjoint set / connected components
    parent = {}
    def find(i):
        if parent[i] == i:
            return i
        parent[i] = find(parent[i])
        return parent[i]

    def union(i, j):
        root_i = find(i)
        root_j = find(j)
        if root_i != root_j:
            parent[root_i] = root_j

    for b in all_bugs:
        parent[b] = b
    for did in bug_to_dup.values():
        if did not in parent:
            parent[did] = did

    for bid, did in bug_to_dup.items():
        union(bid, did)

    # Group bugs by root cluster
    clusters = defaultdict(list)
    for bid in all_bugs:
        clusters[find(bid)].append(bid)

    cluster_sizes = Counter({k: len(v) for k, v in clusters.items()})
    multi_bug_clusters = {k: v for k, v in clusters.items() if len(v) > 1}

    print(f"Total clusters (including singletons): {len(clusters)}")
    print(f"Multi-bug duplicate clusters (>1 bug): {len(multi_bug_clusters)}")

    sizes = [len(v) for v in multi_bug_clusters.values()]
    print(f"Multi-bug cluster size distribution: min={min(sizes)}, max={max(sizes)}, median={sorted(sizes)[len(sizes)//2]}")
    total_in_multi = sum(sizes)
    print(f"Total bug reports in multi-bug clusters: {total_in_multi}")

    print("\nTop 10 largest duplicate clusters:")
    for root_id, sz in cluster_sizes.most_common(10):
        print(f"Cluster Root {root_id}: {sz} bugs")

if __name__ == "__main__":
    analyze_duplicates()

