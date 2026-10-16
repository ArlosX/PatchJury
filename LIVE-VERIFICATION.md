# Live end-to-end verification — 2026-10-16

Deployment: https://patchjury.vercel.app/
StudioNet contract: 0xDD7c6fa8605d04C366B998e7c9A4BA398F720d94

The user signed registration and review transactions. The UI showed these
recorded outcomes; the read-only gate then independently read finalized
contract state and verified the exact committed candidate:

| Case | UI criteria | Recorded decision | Live gate exit |
| --- | --- | --- | --- |
| REL-RETRY-CAP-001 | PASS / PASS / PASS | READY | 0 |
| REL-RETRY-BLOCKED-001 | FAIL / FAIL / PASS | BLOCKED | 1 |
| REL-RETRY-INSUFFICIENT-001 | PASS / UNKNOWN / PASS | INSUFFICIENT | 1 |

The READY case persisted after a browser refresh, as confirmed by the user.
All three outcomes above were subsequently retrieved from finalized state
by scripts/release-gate.mjs.

The gate was run in an isolated local clone at commit
0e746ac4db9adfb452cc2b452262a583558fb989 with Git origin set to
https://github.com/ArlosX/PatchJury.git.
Candidate: examples/review-ready/candidate.py
SHA-256: 34074c3bf12d1fe4db49d405f61fa9fce823d63b8a09fe9b63a592f81ef34ca0

Appending one newline to the candidate while keeping the same READY case
caused exit 1: "checked-out candidate file differs from the reviewed bytes".
The temporary candidate was restored afterward.

Windows checkout note: automatic LF-to-CRLF conversion also changes the
reviewed bytes and correctly blocks the gate. For this verification, the
isolated clone used core.autocrlf=false and checkout-index --force --all
to restore the exact Git blob bytes. A CI checkout must preserve the same
bytes as the raw source reviewed by the contract.

No transaction was sent by the agent during these gate checks. Local test
doubles described in TEST-REPORT.md remain separate from these live results.
Mobile viewport verification and adversarial live consensus testing beyond
these three cases are not established by this report.
