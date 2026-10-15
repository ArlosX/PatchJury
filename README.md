# PatchJury

**Release decisions with receipts for agent-authored code.**

PatchJury asks a narrow, consequential question: does this exact committed candidate satisfy a maintainer's release policy, and does a pinned test report provide enough evidence to ship it? A GenLayer Intelligent Contract reads the public sources and the associated GitHub Actions run, has validators independently assess the same material, and records a structured `READY`, `BLOCKED`, or `INSUFFICIENT` verdict. A read-only CI gate checks the finalized verdict, successful CI run, Git commit and local file bytes before allowing a release job to continue.

This is a new project, separate from Genlos and Faultline. It is **not yet deployed**. The UI intentionally shows no fabricated cases or scores before a contract is configured.

## Why GenLayer is central

A conventional CI check can compare hashes and run known tests. It cannot decide whether an agent's implementation really addresses a natural-language requirement, whether a test report is substantively adequate, or whether the patch drifts outside the agreed scope. PatchJury's three criterion judgments occur inside a GenLayer non-deterministic block. Validators fetch the same commit-pinned files, verify their SHA-256 commitments, independently make the assessment, and compare decision-critical fields. Deterministic code derives the release decision from those fields.

| Criterion | `PASS` | `FAIL` | `UNKNOWN` |
| --- | --- | --- | --- |
| Remediation | Candidate materially meets the policy | Positive evidence it violates the policy | Evidence is too thin or ambiguous |
| Regression | Specific, credible required test evidence | A required test is known to fail | No adequate test evidence |
| Scope | Change stays inside the policy's boundary | Positive evidence of prohibited drift | Scope cannot be established |

`BLOCKED` takes precedence when any criterion fails. `READY` requires all three to pass and a completed, successful GitHub Actions run for the candidate commit. All other combinations yield `INSUFFICIENT`. If a source fails to load, its bytes differ from the commitment, or the CI run belongs to another repository or commit, the review transaction fails **without storing a verdict**.

## Product flow

1. The maintainer prepares a public repository with baseline code, candidate code and a test report at commit-pinned `raw.githubusercontent.com` URLs. Candidate and report must use the same commit. A GitHub Actions workflow runs on that commit.
2. The maintainer writes the release policy in PatchJury and registers the three URLs with their SHA-256 hashes plus the public run API URL (`https://api.github.com/repos/OWNER/REPO/actions/runs/RUN_ID`). The request is immutable.
3. Anyone can request a GenLayer review. The contract reads all three files and the workflow run, confirms the run belongs to the declared repository and candidate commit, and produces an onchain verdict after consensus. The app waits for finalization and shows only finalized state.
4. The release job runs `scripts/release-gate.mjs`. It exits successfully only if the finalized verdict is `READY`, every criterion is `PASS`, the case and verdict commitments match, the workflow completed successfully for the checked-out `HEAD`, Git `origin` matches the declared repository, and the local candidate file's hash matches the reviewed bytes.
5. New evidence or code goes into a new case with `parent_id`, preserving the history. The original author alone may register a revision for the same repository.

## Run locally

Requires Node.js 22 or later.

```bash
npm ci
npm run dev
npm run build

# Check the exact contract source against the StudioNet schema endpoint
npm run schema:check
```

Copy `.env.example` to `.env.local` when a v1 contract is deployed and set `VITE_PATCHJURY_CONTRACT_ADDRESS`. The default RPC is GenLayer StudioNet. The frontend holds no private keys.

The contract source is [`contracts/patchjury.py`](contracts/patchjury.py). Use GenLayer Studio or the CLI to deploy it to StudioNet. Before publishing the site, verify `get_protocol()` returns `patchjury-v1`; then configure the deployed address, rebuild and publish `dist/`. The public site must be available over HTTPS for reviewers, and any evidence files must be independently accessible to GenLayer validators. A deployment address or transaction is deliberately absent from this README until verified.

If Studio shows `Could not load contract schema`, run `npm run schema:check` first. This queries StudioNet with the exact local source without deploying. If it succeeds, reopen the Contracts view, remove the stale Studio editor copy, import the file from `contracts/patchjury.py` again, and return to Run and Debug. Do not edit the first `Depends` line or replace its pinned runner hash. A successful schema check does not prove deployment or execution success.

## CI gate

Set `PATCHJURY_CONTRACT_ADDRESS` to the deployed v1 contract. Run the gate **from the target repository** at the exact release commit:

```bash
node /path/to/patchjury/scripts/release-gate.mjs REL-CASE-ID path/to/candidate-file
```

The target repository must have `genlayer-js` installed for the gate script or bundle the gate with its dependencies. [`examples/release-workflow.yml`](examples/release-workflow.yml) is an integration outline; adapt it to the target repository's layout and protect its release workflow with branch rules. Merely deploying PatchJury does not block releases in unrelated repositories.

## Evidence and threat model

- Every source is a raw GitHub URL with a full 40-character commit SHA from the declared repository. A content hash is stored at registration and rechecked by every validator. A force-pushed branch name cannot silently change the reviewed bytes.
- The GitHub Actions API provides an independently fetched run status, conclusion, repository and head commit. It establishes that GitHub reports a successful workflow on this commit. It does not independently attest that the submitted test-report file contains that workflow's output; maintainers should link the actual workflow artifact or log in the report and protect the workflow configuration.
- Source text is untrusted input to the prompt. The contract instructs the model to ignore instructions in evidence, constrains outputs to three criterion enums and verifies submitted quotes occur in fetched source text.
- The leader's decision is never accepted merely because it is well formed. Validators fetch evidence again and independently derive the three criterion values. Disagreement can make a transaction undetermined; that does not create a passing verdict.
- No wallet can edit an existing case or verdict. A revision uses a new case ID and links to its predecessor. A case's `author` is the submitting wallet, **not proof of GitHub ownership**.
- The UI and gate use finalized state. A submitted EVM transaction, provisional acceptance, or timeout alone is not proof that an Intelligent Contract write succeeded.
- This review evaluates the submitted public code excerpt, test report and workflow-run metadata against the supplied policy. It is not a full vulnerability audit, proof that the report faithfully transcribes the CI log, or a guarantee that the release is safe. Repository owners should pair it with deterministic tests, code review and protected branches.

## Reviewer path after deployment

1. Open the public app and inspect a real release request's policy, three Git commit URLs, SHA-256 commitments and GitHub Actions run.
2. Run a review with a funded StudioNet wallet. Save the GenLayer transaction ID. Wait for finalization and confirm a successful GenVM return.
3. Refresh the page: the verdict and criterion receipts should still come from the contract.
4. Repeat with a candidate that violates scope and one with inadequate test evidence. Confirm `BLOCKED` and `INSUFFICIENT` rather than an unconditional success.
5. Run the gate on the exact candidate commit/file to observe `READY` exit 0. Change the local file, checked-out commit, case ID, or verdict and observe exit 1.

Exact deployed contract, source commit, successful transaction hashes and reproducible samples must be added to this section **after** live execution. Offline compilation alone is not evidence of consensus behavior.

## References

- [GenLayer Equivalence Principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle)
- [Web access](https://docs.genlayer.com/developers/intelligent-contracts/features/web-access)
- [Writing to Intelligent Contracts](https://docs.genlayer.com/developers/decentralized-applications/writing-data)
- [Finality](https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/optimistic-democracy/finality)
