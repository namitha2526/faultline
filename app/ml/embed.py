"""
Faultline Embedding Service
Loads transformer embedding models locally (sentence-transformers/all-MiniLM-L6-v2 by default).
Model name is configurable via environment variable EMBEDDING_MODEL_NAME.
Singleton instance ensures model is loaded once at application startup.
"""

import logging
from typing import Optional
import numpy as np
from sentence_transformers import SentenceTransformer

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    _instance: Optional["EmbeddingService"] = None

    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or settings.EMBEDDING_MODEL_NAME
        self.model: Optional[SentenceTransformer] = None
        self._load_model()

    @classmethod
    def get_instance(cls, model_name: Optional[str] = None) -> "EmbeddingService":
        """Singleton accessor ensuring the model is loaded once."""
        target_model = model_name or settings.EMBEDDING_MODEL_NAME
        if cls._instance is None or cls._instance.model_name != target_model:
            cls._instance = cls(target_model)
        return cls._instance

    def _load_model(self):
        logger.info(f"[EmbeddingService] Loading transformer model '{self.model_name}'...")
        try:
            self.model = SentenceTransformer(self.model_name)
            dim = self.model.get_sentence_embedding_dimension()
            logger.info(f"[EmbeddingService] Model '{self.model_name}' loaded successfully (dimension: {dim}).")
        except Exception as e:
            logger.error(f"[EmbeddingService] Failed to load model '{self.model_name}': {e}")
            raise

    @property
    def dimension(self) -> int:
        if self.model is None:
            return 384
        return self.model.get_sentence_embedding_dimension()

    def embed_text(self, text: str) -> list[float]:
        """Embed a single text string into a normalized vector."""
        if not self.model:
            raise RuntimeError("Embedding model is not loaded.")
        embedding = self.model.encode(
            text,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return embedding.tolist()

    def embed_batch(self, texts: list[str], batch_size: Optional[int] = None) -> list[list[float]]:
        """Embed a batch of text strings into normalized vectors."""
        if not self.model:
            raise RuntimeError("Embedding model is not loaded.")
        if not texts:
            return []

        bs = batch_size or settings.EMBEDDING_BATCH_SIZE
        embeddings = self.model.encode(
            texts,
            batch_size=bs,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return embeddings.tolist()


def get_embedding_service(model_name: Optional[str] = None) -> EmbeddingService:
    """Convenience helper to retrieve the singleton embedding service."""
    return EmbeddingService.get_instance(model_name)
