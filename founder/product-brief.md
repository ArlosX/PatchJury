<!-- /founder:product-brief · 2026-10-16 · input: Review and improve PatchJury as a working GenLayer Builder MVP. -->
# PatchJury product brief

Assumption: the first audience is maintainers reviewing agent-written changes to public repositories. This audience hypothesis has not been established by customer interviews.

## Problem and audience

A passing workflow does not explain whether a proposed code change meets a maintainer's stated release policy. A reviewer needs to inspect the exact candidate, the promised behavior, the test evidence and the resulting decision together. The initial target is a technical maintainer deciding whether a small, public, text-based release candidate should satisfy a defined release gate.

## Value proposition

PatchJury gives maintainers a recorded assessment of committed code against a release policy, with independent GenLayer validator judgments and a CI command that verifies the exact reviewed candidate.

## Six core capabilities

| Capability | Delivered behavior | Why it belongs in this MVP |
| --- | --- | --- |
| Evidence registration | Pin baseline, candidate, test report and CI run | Defines exactly what is reviewed |
| Integrity checks | Verify commit URLs and SHA-256 bytes | Rejects substituted evidence |
| Independent assessment | Validators evaluate remediation, regression and scope | Supplies the GenLayer judgment |
| Recorded decision | READY, BLOCKED or INSUFFICIENT | Gives a bounded operational result |
| Revision history | New immutable case linked to its predecessor | Allows new evidence without overwriting history |
| CI release gate | Check finalized verdict, origin, HEAD and file hash | Makes the recorded decision actionable |

## Evidence of implementation

The repository's LIVE-VERIFICATION.md records three real StudioNet cases, the corresponding verdicts, a passing gate on the READY candidate and rejection after a one-byte change. SECURITY-REVIEW.md separates local test doubles from live checks. These are integration examples, not evidence of adoption or commercial demand.

## Proposed validation targets

These are test targets, not current metrics:

- Have 5 independent maintainers inspect one example without assistance.
- At least 4 should correctly explain why the three decisions differ.
- Have 3 maintainers attempt registration with their own small public change.
- Record completion time, failed steps and retry counts rather than assuming speed.
- Get 2 maintainers to run the gate in an opt-in workflow before expanding scope.

## Risks and experiments

1. Trust in an AI verdict may be insufficient. Ask 5 maintainers which evidence they need to accept or challenge a decision. Proposed duration: one week, founder-led outreach, no paid tools required.
2. Preparing three committed files and a matching CI run may be too much work. Observe 3 first-time attempts and record where they stop. Proposed duration: one week; developer time is not priced here.
3. The supplied report may not represent actual CI stdout. Demonstrate this limit explicitly; collect requirements for artifact attestation before claiming a stronger trust guarantee.

## Distribution hypothesis

Start with an existing GenLayer submission/demo, the public GitHub example cases and direct invitations to a small number of public-repository maintainers. Treat all three as proposed experiments. CAC and commercial conversion are unknown. The next product decision should be driven by observed onboarding failures and user evidence.
