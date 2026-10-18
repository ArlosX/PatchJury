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

## Historical receipts recovered on 2026-10-18

Read-only Studio RPC queries recovered and independently checked the six
registration/review transactions below All have FINALIZED status and a successful
GenVM return The final decisions were also reread from contract state

| Case | Registration transaction | Review transaction |
| --- | --- | --- |
| REL-RETRY-CAP-001 | 0xd8e7bbf104092ec68e156dbc9cd296d7e08cc0e13a6da06048c4e8d81ba3c163 | 0xff14e8ff5974ba886ac443c1bd30d7ea194ea6c3b726865dcfd565312720a173 |
| REL-RETRY-BLOCKED-001 | 0x0fc24c957c4c9d676001b65097757855b297dc08ab807078c2918e567a78f375 | 0x55a83ddc2f12463fd6216cccc91f84ec7845ce15de052abd0a5f777aa321d0ce |
| REL-RETRY-INSUFFICIENT-001 | 0x7d12f8c65bdc3dcae034068a0e02f9ab77290425be2e99714dfcfd31b2bd7917 | 0x4b123f71cb55587b09e30beba06fc23ad213e693c94068227efde15d871f36e1 |

Exact deployed v1 contract bytes match contracts/patchjury.py at commit
71fbbefba53df53ca6ff48896340889c8c61d64b
SHA-256 ff8f3d650f59cd78b0111984e5828d9e358414b214d6e53fe42793f8cc5d722a

Machine-readable receipt excerpts and source comparison are in
`docs/verification/v1-finalized-receipts.json` and
`docs/verification/v1-source-equivalence.json`

These are historical v1 results and do not establish v2 correctness
