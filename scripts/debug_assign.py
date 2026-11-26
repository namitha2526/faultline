import asyncio
import uuid
import numpy as np
from sklearn.metrics.pairwise import cosine_distances
from app.core.db import AsyncSessionLocal
from app.models.error import Error
from app.models.cluster import Cluster
from app.ml.service import get_cached_centroids, assign_error_incrementally
from app.core.config import settings

async def main():
    async with AsyncSessionLocal() as session:
        err = await session.get(Error, uuid.UUID('efa90f2d-c8eb-4dd9-9a99-3c4102313e1a'))
        print(f"Error: {err.message}")
        print(f"Exception Type: {err.exception_type}")
        print(f"Has Embedding: {err.embedding is not None}")
        print(f"Project ID: {err.project_id}")

        centroids = await get_cached_centroids(session, err.project_id)
        print(f"Active Centroids Count: {len(centroids)}")

        if err.embedding is not None and centroids:
            q = np.array(list(err.embedding)).reshape(1, -1)
            cids = list(centroids.keys())
            c_mat = np.array([centroids[c] for c in cids])
            dists = cosine_distances(q, c_mat)[0]
            min_i = int(np.argmin(dists))
            min_dist = dists[min_i]
            target_cid = cids[min_i]
            target_c = await session.get(Cluster, target_cid)
            print(f"Closest Cluster: {target_c.title if target_c else target_cid}")
            print(f"Min Distance: {min_dist:.4f}")
            print(f"Threshold: {settings.INCREMENTAL_ASSIGNMENT_THRESHOLD}")
            print(f"Passes threshold? {min_dist <= settings.INCREMENTAL_ASSIGNMENT_THRESHOLD}")

        # Try assign_error_incrementally
        cid = await assign_error_incrementally(session, err)
        print(f"Assigned CID: {cid}")

if __name__ == "__main__":
    asyncio.run(main())

