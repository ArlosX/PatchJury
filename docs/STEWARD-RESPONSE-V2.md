# PatchJury v2 steward response

## What changed

The release gate now binds approval to the exact repository, commit, tracked regular file path, Git blob, clean tracked working tree and staged release artifact digest
It rejects matching bytes at a different path, unrelated or untracked files, dirty tracked files, symlink resolution, unauthorized submitting wallets and altered artifacts

Regression PASS requires an authenticated GitHub Actions witness associated with the exact run, attempt, suite, native check, successful job and capture step
The witness binds the candidate path and digest to the exact captured test output and committed report digest
The example executes candidate tests in a read-only container without network or host credentials

The assessment scope is explicitly the complete individual candidate file
Public assessments carry community-submitted provenance and do not claim GitHub maintainer authorization
The protected release workflow separately loads trusted gate code and a maintainer policy from main

Each criterion requires exact source lines, a quotation, a substantive explanation and a reason category
Independent validator recomputation and a separate semantic support check reject conflicting interpretations
Malformed model output cannot become READY

Registry access is bounded to newest-first pages of at most 25 records with a Load more control

## Deployment and source identity

- Website https://patchjury.vercel.app/
- Contract https://explorer-studio.genlayer.com/address/0x4fd97fE30D6c07f6f348C12a70416fbD0E15DD06
- Reviewed source commit 9110ad750d5436dd4ceebce600c53c8f9380820a
- Contract source SHA-256 10c212d6bb86829fdf020124ba92616b5b9a8e8be6b2a23613431b57d09b71b3
- Successful deployment transaction 0x8e3d2f5604684939aa1051e1b320cf2375d99729d57f822f45af1e0b409c067d
- Deployed source was compared byte for byte with the reviewed source

## Live validator results

| Case | Decision | Successful review transaction |
| --- | --- | --- |
| PJ2-READY-2DCAF77F | READY | 0xfeda4f6a3f243c0e998e810d1e0b68e14e2c2b8464e94ae593b6198e94d705c7 |
| PJ2-BLOCKED-8CFFFF2C | BLOCKED | 0xfb2e0fc80201da1b4455faf94f2fcc27aa29daae37db8a6ad6ccbb9d217c1a27 |
| PJ2-INSUFFICIENT-6C31C0A9 | INSUFFICIENT | 0xab835e0aa672f5c5c8a934a6d7817f49d2c8625ed48e69a703e470e4ef26748b |

All six registration and review receipts were independently checked for successful GenVM returns and matching finalized case commitments
The candidate evidence is pinned to commit d9cfb51f98186739c559e6ac4c0e8fce0403afcd
The authenticated regression run is https://github.com/ArlosX/PatchJury/actions/runs/39158191856

## Enforced release evidence

The actual protected main-branch workflow published the exact READY artifact
Separate actual runs rejected BLOCKED, INSUFFICIENT, a nonexistent case, the wrong commit, identical bytes at the wrong path and a tampered artifact
For each rejected run the release job was skipped
The gate failure reasons were inspected to distinguish security rejections from infrastructure failures

See [the requirement map](REVIEW-REMEDIATION.md) for all seven run links
See [the machine-readable workflow evidence](verification/v2-protected-release-runs.json) for step conclusions, gate log excerpts and artifact metadata

## Reproduction and limits

Load a READY, BLOCKED or INSUFFICIENT fixture from the website
Connect a StudioNet wallet, register the case and run its review
Inspect criterion-specific evidence and reload the page to read finalized contract state

The assessment is a policy judgment about one candidate file and authenticated test evidence
It is not a repository-wide security audit or proof that maintainer-authored tests are honest
External GitHub API availability can interrupt a review
Two observed HTTP 403 failures rolled back without recording a verdict and a subsequent review succeeded
The current public site was checked at widths 360, 390, 768 and 1440 without horizontal overflow or page errors

Automated coverage includes 52 contract tests with explicit doubles and 61 Node tests
Those controlled tests are documented separately from the actual validator and protected release evidence above
