"""Measure single error ingestion and incremental clustering latency."""
import time
from app.ml.cluster import assign_incrementally
from app.ml.embed import get_embedding_service
from app.ml.preprocess import preprocess_error
import numpy as np

def measure_latency():
    svc = get_embedding_service()
    
    # Pre-generate 10 synthetic cluster centroids
    centroids = {f"cluster_{i}": np.random.normal(size=384) for i in range(10)}
    for cid in centroids:
        centroids[cid] /= np.linalg.norm(centroids[cid])
        
    times = []
    for _ in range(50):
        t0 = time.perf_counter()
        doc = preprocess_error(
            "TypeError",
            "Cannot read properties of null (reading 'id') for user usr_9941",
            "    at handleAuthCallback (https://app.faultline.io/src/auth.ts:42:15)\n    at dispatchLoginAction (https://app.faultline.io/src/store.ts:108:5)"
        )
        emb = svc.embed_text(doc)
        assign_incrementally(emb, centroids, threshold=0.25)
        times.append((time.perf_counter() - t0) * 1000)
        
    p50 = np.percentile(times, 50)
    p95 = np.percentile(times, 95)
    p99 = np.percentile(times, 99)
    print(f"Incremental Assignment Latency (50 runs): p50={p50:.2f}ms, p95={p95:.2f}ms, p99={p99:.2f}ms")

if __name__ == "__main__":
    measure_latency()
