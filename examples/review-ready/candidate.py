"""Release candidate: cap exponential retry delays at 800 milliseconds."""


def retry_delay_ms(attempt: int) -> int:
    return min(100 * (2 ** attempt), 800)
