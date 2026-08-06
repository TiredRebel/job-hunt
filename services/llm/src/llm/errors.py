"""Domain errors for the LLM service."""


class LlmError(Exception):
    """Base class for all LLM-service errors."""


class MissingApiKeyError(LlmError):
    """The provider row names an env var that is not set."""

    def __init__(self, env_name: str) -> None:
        """Store the missing environment-variable name."""
        super().__init__(f"environment variable {env_name!r} is not set")
        self.env_name = env_name


class UnknownProviderKindError(LlmError):
    """No factory is registered for the requested provider kind."""


class UnknownProviderError(LlmError):
    """No provider row exists for the requested slug."""


class NoActiveProviderError(LlmError):
    """``core.llm_providers`` has no active row."""


class ModelResolutionError(LlmError):
    """Neither a pipeline override nor ``default_model`` yields a model."""


class ProviderRequestError(LlmError):
    """The upstream provider HTTP call failed."""


class SchemaValidationError(LlmError):
    """The provider reply did not validate against the pipeline schema."""


class PromptInjectionDetectedError(LlmError):
    """The composed prompt matched a known prompt-injection pattern."""

    def __init__(self, signals: list[str]) -> None:
        """Store the matched signal labels (see ``pipelines.injection_guard``)."""
        super().__init__(f"prompt_injection_blocked:{','.join(signals)}")
        self.signals = signals
