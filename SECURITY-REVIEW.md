# PatchJury v2 security review

## Authorization boundary

Public case submission records a wallet address and community-submitted provenance
It makes no assertion that the wallet owns or maintains the GitHub repository
A READY assessment covers only the individual candidate file against the stated policy
The protected release gate separately requires an approved author, candidate path and contract from the trusted maintainer policy
That policy and the gate are loaded at the immutable workflow commit from protected main, separately from the reviewed candidate

## File and artifact integrity

The gate derives the exact repository path and commit from the immutable candidate URL
It validates Git origin, HEAD, tracked regular blob mode, source digest, working-tree bytes and clean tracked/index contents
Every path component is checked for unsafe symbolic links or junctions
The example stages a distinct candidate artifact, verifies its bytes before the job handoff and checks the resulting digest again in the release job
Other artifacts are not implicitly authorized

## Regression witness

A successful unrelated workflow cannot authenticate a report
The contract checks a successful GitHub Actions app check attached to the exact run suite
The witness includes the run ID/attempt, native check external ID, actual job ID, commit, candidate path/hash and exact report hash/content
The associated successful job must contain the successful test capture step
The publisher preserves GitHub's native metadata instead of relying on custom metadata that GitHub overwrites on completion
The example executes reviewed code in a read-only container without network access, host credentials or a Docker socket
Only the host publisher receives the check-writing token after tests complete

## Validator support

Each criterion has a bounded exact source-line citation, an explanation and a reason category
Validators independently retrieve and assess the evidence
They require matching criteria and compatible reason categories plus a separate semantic support check
A material conflict rejects agreement and leaves no recorded verdict
The aggregate decision is calculated deterministically from the accepted criterion values

## Resource bounds

Source files are bounded to 12 KB each
CI responses and listings are bounded and fail closed if incomplete
Registry views return at most 25 indexed cases and associated verdicts per call
The frontend loads additional pages only on request and looks up explicit deep links individually

## Protections actually configured

Main requires a pull request and passing security-boundaries status from the GitHub Actions app
Administrator enforcement is enabled and force pushes/deletion are disabled
The patchjury-release environment restricts deployment to protected branches
The release workflow additionally requires refs/heads/main and successful verify-release dependency
The repository has a single maintainer, so an additional human review approval is not asserted

## Residual limits

Repository-controlled workflows and tests remain evidence from that repository
Their authentication does not prove that a malicious maintainer wrote honest tests
Model-based interpretation can disagree and is not a complete security audit
Public RPC and GitHub availability affect execution
A repository owner can remove protections or release outside the adopted workflow
Historical v1 cases do not gain v2 protections retroactively
V2 live assessments and the protected release run matrix remain required acceptance evidence
