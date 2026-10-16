"""Run the exact release policy checks with no third-party dependencies."""
from pathlib import Path
import importlib.util

root = Path(__file__).parent
spec = importlib.util.spec_from_file_location("candidate", root / "candidate.py")
candidate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(candidate)

expected = [(0, 100), (1, 200), (2, 400), (3, 800), (4, 800), (10, 800)]
for attempt, delay in expected:
    actual = candidate.retry_delay_ms(attempt)
    assert actual == delay, f"attempt={attempt}: expected={delay}, actual={actual}"
    print(f"PASS retry_delay_ms({attempt}) == {delay}")
print("6/6 policy assertions passed")
