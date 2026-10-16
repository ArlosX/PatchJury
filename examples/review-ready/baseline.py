"""Baseline: exponential retry delay has no upper bound."""


def retry_delay_ms(attempt: int) -> int:
    return 100 * (2 ** attempt)
