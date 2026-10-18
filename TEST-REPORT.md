# PatchJury v2 verification status

## Automated coverage

- 52 deterministic contract tests with controlled GenVM, network and model doubles
- 22 client tests including successful-return checks, wallet network validation and bounded registry reads
- 20 input-validation tests
- 18 release-gate tests using real temporary Git repositories and filesystem operations
- 1 React rendering test for untrusted title, policy and verdict content

Gate coverage includes exact tracked candidate acceptance, matching staged artifact acceptance,
matching bytes at another path, unrelated files, untracked candidates, modified candidate,
modified unrelated tracked modules, staged changes, commit/case mismatch, BLOCKED/INSUFFICIENT,
unauthenticated regression witness, unauthorized submitter, repository-wide/legacy verdicts,
altered release artifact and unsafe directory symlink/junction resolution

Windows does not allow an unprivileged file-symlink test in this environment
The portable test creates an actual directory junction on Windows and a directory symlink on Linux
It asserts the gate's symlink-resolution error rather than counting setup failures as rejections

## Actual external checks

- Official Studio schema validation passed with 8 methods
- New StudioNet contract 0x6D4D91AAc38a15cD9525f43d9755791E305b02C4 deployed successfully
- Successful deployment transaction 0x7142006d264bb47c55bafda9868fa064b9e5bb53eca4021f865f44c866e810ba
- Deployed source matches reviewed commit 9c4073fb1033595d7c3ef6f084c90e6e5196e768 byte for byte
- Source SHA-256 27b432c408345e79aa2f0b8f9f268fdc6f803c09f678736b36049206c34aa95d
- Protocol and bounded empty registry read from the actual deployed contract
- Authenticated regression workflow https://github.com/ArlosX/PatchJury/actions/runs/39158191856 succeeded
- Its native check ID, external ID, job ID, run attempt, suite and exact captured report content were independently verified
- The captured actual API objects were replayed through the contract authentication logic with a controlled model double
- Browser verification passed for the actual v2 protocol connection, fixture form and widths 360/390/768/1440 without signing transactions

## Remaining acceptance evidence

Live READY testing exposed a model supports list where the implementation expected a dictionary
A replacement contract now handles invalid top-level responses, support containers, individual references and malformed leader support without an AttributeError
These failure modes have dedicated regression tests
Replacement deployment, successful READY/BLOCKED/INSUFFICIENT v2 assessments and protected release runs are pending
No local model double is represented as validator consensus
No historical v1 result is represented as proof of the v2 changes
See docs/REVIEW-REMEDIATION.md for the remaining run matrix
