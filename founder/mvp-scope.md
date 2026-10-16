<!-- /founder:mvp-scope · 2026-10-16 · input: Assess the existing PatchJury MVP and prioritize only submission-relevant improvements. -->
# PatchJury MVP scope review

Assumption: this release is a public StudioNet demonstration for a technical reviewer, with public code only.

## Feature triage

| Feature | Category | Reason |
| --- | --- | --- |
| Immutable evidence and exact-byte checks | Must have, delivered | Prevents reviewing a different candidate |
| Independent validator assessment | Must have, delivered | Core decision mechanism |
| Three outcome states | Must have, delivered | Distinguishes contrary evidence from missing evidence |
| Author-owned revisions | Must have, delivered | Preserves original records |
| Finalized-state CI gate | Must have, live verified | Connects the judgment to a release workflow |
| Direct access to published test cases | Should have, implemented in this review | Lets a new reviewer find evidence without knowing case IDs |
| Registration prerequisites | Should have, implemented in this review | Reduces avoidable signing and evidence-preparation failures |
| Paid plans | Won't have for this release | No pricing or demand evidence supplied |
| Escrow and token incentives | Won't have for this release | Adds financial risk without proving the core use case |
| Automatic merging or deployment | Won't have for this release | Exceeds the existing opt-in release gate |
| Private repositories | Won't have for this release | Current evidence is publicly fetched and recorded |
| Large monorepository review | Won't have for this release | Each source is limited to 12 KB and the review is bounded |

## MVP definition and critical flow

A maintainer can register public, commit-pinned evidence, obtain a recorded release-policy decision and use that finalized decision in an opt-in CI gate. Completion time has not been measured and no sub-minute promise is made.

1. Inspect a published example and its locked policy/evidence.
2. Prepare a baseline, candidate, detailed test report and completed CI run.
3. Register the request with a wallet and wait for finality.
4. Request review, inspect criteria and exact excerpts, then verify the gate.
5. Register a linked revision if evidence or policy changes.

## Technical scope

The existing React/Vite interface, GenLayer contract and read-only Node gate deliver the scoped flow. Retain the deployed contract and existing white/black workspace identity. This review adds discoverability and onboarding copy. No new service, account system, analytics SDK or payment integration is needed.

Future work needs separate sizing. CI artifact attestation, indexing and adversarial live model benchmarks are not minor copy changes, and no credible solo build-time estimate is available from this review.

## Revisit triggers

- Add pagination/indexing when a measured registry size causes read or render failures.
- Investigate report-to-artifact attestation when maintainers identify it as a blocker.
- Consider private sources only after agreeing on privacy, validator access and key management.
- Consider monetization after independent maintainers repeat the core flow.
- Expand review scope after representative patches establish useful decision quality.

## Launch criteria

The production build and automated checks pass; the live app connects to the correct protocol; all three recorded decisions can be inspected; the READY gate accepts exact bytes and denies modified bytes; revisions preserve prior cases; the phone view shows evidence and actions without clipping; public-data and finality requirements are visible.

External interview and demand evidence remain missing. The first-user test is whether a maintainer can prepare and interpret a real case without assistance.
