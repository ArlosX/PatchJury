<!-- /founder:landing-page · 2026-10-16 · input: Improve reviewer-facing copy and onboarding in the existing PatchJury workspace. -->
# PatchJury reviewer-facing copy

Assumption: improve the existing application rather than add a separate marketing page. The founder explicitly requested a workspace distinct from prior builds and a browser title containing only the project name.

## Opening message

Headline: Review inbox

Subheadline: Review agent-written code against your release policy with GenLayer consensus.

Primary action: New review

Proof: link to the three published integration examples, using their actual recorded decisions. Label them test cases. Do not imply three customers or independent deployments.

## Problem and solution copy

- A successful workflow alone does not explain whether the patch meets the promised outcome.
- Changed inputs make an earlier review hard to reproduce.
- Missing test evidence should remain visible in the decision.

PatchJury pins public evidence to exact commits and hashes, records independent criterion judgments and provides a gate for the exact finalized candidate.

## How it works

1. Prepare public baseline code, candidate code and a detailed test report.
2. Use commit-pinned URLs; candidate and report share a commit with a completed GitHub Actions run.
3. Register the request, confirm it in a wallet and wait for finality.
4. Run review, inspect the decision and use the opt-in gate.

Do not promise completion in five minutes. StudioNet finality and inference times are variable.

## Reviewer questions

### Is READY a security audit?

It is a bounded release-policy assessment of the supplied evidence. It does not certify the entire repository or establish that omitted code is safe.

### What information becomes public?

The release policy and evidence links are public onchain. Use public code and test material appropriate for disclosure.

### What is the difference between BLOCKED and INSUFFICIENT?

BLOCKED reflects at least one failed criterion. INSUFFICIENT reflects unresolved criteria without an established failure.

### Does the gate control every release?

It controls only workflows that adopt the gate. It checks the finalized READY case against the repository, commit, candidate file and CI witness.

### Can evidence be corrected?

A new author-owned revision links to the earlier case. Existing records remain fixed.

## Proof and commercial claims

Use live case links, source code, test logs and the gate verification report. Customer testimonials, time-saved claims, paying users and prices are unavailable and must not be published as facts. Private future testimonial slots: [Maintainer feedback after an independent registration], [Maintainer feedback after adopting the gate].

## Metadata

Title: PatchJury, as explicitly requested by the founder.

Suggested description: Review agent-written code against your release policy with GenLayer consensus, commit-pinned evidence and a CI gate tied to finalized decisions.

Target phrases: release policy review; agent code review; GenLayer release gate. These are positioning choices, not measured search demand.
