# PatchJury

A consensus-backed assessment and opt-in release gate for an individual committed source file

Website: https://patchjury.vercel.app/
Repository: https://github.com/ArlosX/PatchJury

## Security upgrade status

The v2 implementation addresses the steward's file identity, CI evidence, scope, validator support, provenance and registry requirements
The existing production v1 deployment does not contain the v2 changes
The corrected v2 contract is deployed at 0x4fd97fE30D6c07f6f348C12a70416fbD0E15DD06
Its source matches reviewed commit 9110ad750d5436dd4ceebce600c53c8f9380820a byte for byte
It explicitly specifies the model JSON shape and fails closed on invalid shapes
The v2 live case and protected release demonstrations are still required before claiming the upgrade complete
See docs/REVIEW-REMEDIATION.md for the exact status and completion requirements

## What it does

Register immutable baseline, candidate and report URLs pinned to Git commits with SHA-256 commitments
GenLayer independently retrieves evidence and evaluates remediation, regression and scope
Validators independently recompute criteria and check criterion-specific evidence support
The contract derives READY, BLOCKED or INSUFFICIENT deterministically from the final criteria
The frontend retrieves finalized records with bounded registry pages

All public cases are community assessments
READY concerns the individual candidate file only and does not prove repository-maintainer authorization
Repository-wide restrictions that cannot be established from the file require UNKNOWN rather than implied approval

## Regression evidence

The v2 contract requires a GitHub Actions app check belonging to the exact declared run suite and attempt
The check must be associated with a successful job containing the successful Capture actual regression output step
Its structured witness binds the candidate commit/path/hash and the exact submitted test-report content/hash
An unrelated successful workflow cannot authenticate a report without that matching witness

The example regression workflow runs tests in a read-only container without network access or host credentials
Captured stdout must exactly match the committed report before the host publishes its run-associated check
The publisher updates the existing job check rather than creating an unrelated check suite

Repository-controlled test output remains an evidence claim whose relevance is assessed by validators
This system does not replace a security audit or establish that arbitrary repository-maintainer-controlled tests are honest

## Maintainer-controlled release gate

The gate reads finalized v2 state and requires

- READY and all three criteria PASS
- Matching immutable case commitment and authenticated CI witness
- Matching repository, exact commit and exact candidate repository-relative path
- Tracked regular Git blob at that commit with matching SHA-256 and local bytes
- No symlinks and no modified tracked worktree or staged files
- Author and path approved in a separately trusted maintainer policy
- Staged single-file release artifact matching the reviewed bytes when --artifact is supplied

```sh
PATCHJURY_POLICY_FILE=/trusted/.patchjury/release-policy.json \
PATCHJURY_CONTRACT_ADDRESS=0xYOUR_V2_ADDRESS \
node /trusted/scripts/release-gate.mjs CASE_ID examples/review-ready/candidate.py --artifact .patchjury-output/candidate.py
```

The policy must be maintained separately from untrusted release inputs
The protected workflow loads gate code and policy from main, checks out the candidate separately and makes release depend on successful verification
It verifies the artifact hash again after the job handoff
The workflow publishes only the reviewed single-file candidate artifact
Other release files are not authorized by that decision

## Local development

```sh
npm ci
npm run dev
```

Configure VITE_PATCHJURY_CONTRACT_ADDRESS with the new v2 address after source equivalence is verified
The production v1 address remains in the existing deployment settings until the verified upgrade is ready

## Verification

```sh
npm test
python -m unittest discover -s tests -p test_contract.py
npm run build
npm run schema:check
node scripts/verify-deployment.mjs 0xYOUR_V2_ADDRESS
```

The schema command sends contract source to the official Studio service
Automated contract tests use controlled web/model/GenVM doubles
Historical live v1 verification is documented in LIVE-VERIFICATION.md and is not proof of v2 behavior

## Limits

The contract inspects bounded complete source files, each at most 12 KB
It assesses one candidate file rather than every changed file in a commit
GitHub API and StudioNet availability affect evidence retrieval and consensus latency
The workflow and policy must be protected by the repository adopting the release gate
A public verdict does not prevent releases made outside that adopted workflow
