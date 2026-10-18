# PatchJury v2 reviewer remediation

This document maps the steward request to implementation and reproducible evidence
The production v1 contract and its historical decisions are not v2 verification

| Request | Implementation | Evidence |
| --- | --- | --- |
| Complete candidate identity | Exact raw URL path, Git root containment, symlink rejection, tracked regular blob at HEAD, digest equality and clean tracked worktree | tests/gate.test.cjs uses real temporary Git repositories |
| Authentic regression evidence | GitHub Actions app check tied to the run suite, run attempt, successful job/step, commit, candidate path/hash and exact captured report hash/content | tests/test_contract.py includes forged report, unrelated workflow, wrong attempt, wrong suite, wrong app and wrong path |
| Accurate scope | Every case/verdict explicitly has scope_mode candidate-file and community-submitted provenance The prompt requires UNKNOWN for repository-wide policy requirements that cannot be established from the individual file | contracts/patchjury.py and visible review boundary in src/App.tsx |
| Substantive criterion support | Per-criterion source, line range, exact quotation, explanation and reason category Independently recomputed criteria plus a separate semantic support/equivalence check Disagreement does not record a verdict | test_conflicting_semantic_interpretation_rejected and test_validator_disagreement |
| Maintainer provenance | Public assessment never claims maintainer authorization Release gate separately requires the submitting wallet and candidate path to appear in a trusted maintainer policy | .patchjury/release-policy.json and unauthorized-wallet adversarial test |
| Enforced release dependency | release needs verify-release Successful verification produces a hash-bound artifact which is checked again in the release job Protected environment limits release to protected branches | .github/workflows/protected-release.yml |
| Bounded registry | Index-based newest-first pages limited to 25 cases with associated verdicts Explicit Load more control and individual deep-link lookup | get_registry_page and registry bound tests |
| Source/deployment evidence | Exact deployed source comparison and finalized case/receipt verification scripts | scripts/verify-deployment.mjs and scripts/verify-live.mjs |

## Trust boundaries

READY applies to the complete individual candidate file against the stated policy
It is not approval of an entire repository or a general security audit
Tracked working-tree cleanliness prevents an altered local module being silently released with a reviewed candidate, but it does not expand the contract's assessment scope

The regression witness authenticates output from repository-controlled GitHub Actions infrastructure
It does not make a malicious repository maintainer or a deliberately dishonest test suite trustworthy
The example executes the candidate/test in a read-only container without network or host credentials
The host captures stdout and publishes it using a GitHub Actions check associated with the current job
Unrelated successful workflows without the matching run-bound witness cannot establish regression PASS

The public submitting wallet is not authenticated as the GitHub maintainer
A repository adopts the gate by approving a trusted policy listing allowed wallet addresses, candidate paths and the exact contract
In CI that policy and gate code are loaded from the protected default branch, separately from the candidate checkout
Changing the supplied policy on a self-controlled local machine cannot provide evidence that a protected repository release was authorized

## Reproduce local security checks

```sh
npm ci
npm test
python -m unittest discover -s tests -p test_contract.py
npm run build
```

Python contract tests use explicit GenVM/web/model doubles
Gate tests use real Git repositories and file operations but controlled finalized records
Neither substitutes for live validator consensus or the protected workflow runs below

## Required live completion record

The following must be populated from actual runs before resubmission

- New v2 contract address and deployment transaction
- Successful deployed-source comparison including reviewed Git commit and SHA-256
- Authenticated regression workflow URL and GitHub check URL
- New READY, BLOCKED and INSUFFICIENT case IDs and finalized successful transaction receipts
- Protected release run where matching READY produces released-reviewed-candidate
- Protected runs where BLOCKED, INSUFFICIENT, missing case, wrong commit, wrong candidate path and altered artifact prevent release

Current state: v2 deployment and source equivalence are verified in docs/verification/v2-source-equivalence.json
The corrected deployment transaction is 0x8e3d2f5604684939aa1051e1b320cf2375d99729d57f822f45af1e0b409c067d
The actual run-associated regression witness is verified in docs/verification/v2-ci-witness.json
The first v2 live review exposed a malformed supports list from the model
The corrected replacement is deployed at 0x4fd97fE30D6c07f6f348C12a70416fbD0E15DD06 and source-verified
Live READY PJ2-READY-2DCAF77F and BLOCKED PJ2-BLOCKED-8CFFFF2C cases and their four successful finalized receipts are independently verified in docs/verification/v2-live-cases.json
The exact READY artifact passed the local release gate and BLOCKED, wrong case ID, identical bytes at a wrong path and altered artifact were rejected
Live INSUFFICIENT PJ2-INSUFFICIENT-6C31C0A9 and its successful registration and review receipts are also verified
Two earlier attempts reached GenVM but rolled back because GitHub Actions returned HTTP 403, without recording a verdict
Protected release runs remain pending
Historical v1 results are preserved separately in LIVE-VERIFICATION.md

## Release demonstration

Dispatch Protected candidate release from the protected main branch
Use the exact reviewed commit and case ID
The only released artifact is examples/review-ready/candidate.py
This demonstration does not claim to publish a complete application build

Success requires a valid v2 READY case whose author and path match the protected maintainer policy
The regression evidence workflow must already have completed on the candidate commit
For the altered artifact scenario enable tamper_artifact
For path mismatch use another repository-relative path even if its bytes match
For other negative scenarios supply the corresponding non-ready or missing case ID, or a different commit
Inspect both verify-release and release: rejected inputs must leave release skipped
Download the released-reviewed-candidate artifact only from a successful protected run

## Independent verification

```sh
node scripts/verify-deployment.mjs NEW_V2_ADDRESS
node scripts/verify-live.mjs artifacts/live-input.json
```

The live input file contains address and cases with id, expected and transaction_hashes
Only FINALIZED transactions with FINISHED_WITH_RETURN count as successful receipts
Missing hashes are explicitly marked rather than fabricated
