"""Encryption for provider API keys stored by the LLM service."""

import base64
import hashlib

from cryptography.fernet import Fernet, InvalidToken


class CredentialCipher:
    """Encrypt and decrypt provider credentials with the service's internal secret.

    The derived Fernet key is never persisted.  Provider API keys therefore do
    not need an environment variable and are never returned through the API.

    Args:
        internal_token: Existing service-to-service secret used as the master
            key material.
    """

    def __init__(self, internal_token: str) -> None:
        """Build a cipher from the service's existing internal token."""
        key = base64.urlsafe_b64encode(hashlib.sha256(internal_token.encode()).digest())
        self._fernet = Fernet(key)

    def encrypt(self, value: str) -> str:
        """Return an authenticated ciphertext for a non-empty API key."""
        return self._fernet.encrypt(value.encode()).decode()

    def decrypt(self, ciphertext: str) -> str:
        """Return the original API key or raise a safe configuration error."""
        try:
            return self._fernet.decrypt(ciphertext.encode()).decode()
        except (InvalidToken, UnicodeDecodeError) as exc:
            raise ValueError("stored provider credential cannot be decrypted") from exc
