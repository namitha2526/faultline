# Faultline ML Module Architecture

This module houses the semantic error grouping engine, replacing legacy hash-based grouping with embedding-based clustering:

1. **Preprocessing (`preprocessing.py`)**:
   - Stack frame tokenization and pruning.
   - Message variable neutralization (stripping UUIDs, hex values, user identifiers).
   - Contextual synthesis (combining exception type, normalized root frames, and sanitized message).

2. **Embeddings (`embeddings.py`)**:
   - Generates 384-dimensional dense vectors using models like `sentence-transformers/all-MiniLM-L6-v2`.
   - Vector storage in PostgreSQL using the `pgvector` extension column: `embedding vector(384)`.

3. **Clustering (`clustering.py`)**:
   - Nearest neighbor retrieval via pgvector IVFFlat / HNSW index (`<=>` cosine distance).
   - HDBSCAN or online centroid-based clustering to automatically discover or merge error clusters.
   - Updates `clusters` table with `first_seen`, `last_seen`, and `error_count`.
