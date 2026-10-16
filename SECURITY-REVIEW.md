# Security and usability review — 2026-10-16

Scope: source review, local adversarial tests, npm dependency audit and
non-destructive checks of https://patchjury.vercel.app/. No attack transactions,
load tests or destructive probes were sent to production or StudioNet.

## Findings and changes

1. Missing framing and browser hardening headers on the initial live deployment.
   Added vercel.json with CSP (including frame-ancestors none), X-Frame-Options
   DENY, nosniff, referrer policy, and camera/microphone/geolocation restrictions.
   Script, style and font resources are limited to this origin; network requests
   are limited to this origin, StudioNet and public raw GitHub sources.
2. Wallet chain selection was trusted after switch/add requests. The client now
   verifies the actual chain again, explicitly selects a newly added chain, and
   re-reads the active account before any write. A refused/ignored chain change
   fails closed. Revision submission checks the original author before writing;
   the deployed contract independently enforces that authorization.
3. Search/status filtering could leave an unrelated case in the detail pane.
   The detail now follows the visible list; its selection and shared URL agree.
   A newly registered case clears old filters so it can be found immediately.
4. The unused development-only genlayer CLI brought six transitive audit alerts,
   including critical Tinypool/Vitest advisories. Removed that unused dependency
   from package.json and lockfile. The frontend retains genlayer-js. Final npm
   audit against the updated lockfile reports zero known vulnerabilities.

## Tests

86 automated tests pass: 33 contract, 20 client, 20 input validation, 12 gate and
1 rendering security test. Controlled doubles replace wallet/network/GenVM/LLM
I/O in unit tests. The XSS rendering test checks actual App HTML output for
escaped malicious case titles, policy and verdict text.

Additional scenarios cover javascript URLs, private hosts, deceptive hostnames,
userinfo URLs, encoded traversal, query/fragment suffixes, revision ownership,
wrong wallet chain, account changes, invalid model enums and keeping embedded
instruction-looking strings within JSON evidence data.

The JSON prompt test is NOT an adversarial live LLM benchmark and does not
establish immunity to prompt injection. Real model behavior remains bounded
by the model and independent validator agreement.

Existing live READY/BLOCKED/INSUFFICIENT and release-gate checks are recorded in
LIVE-VERIFICATION.md. No new signing or review transaction was needed here.

## Limits and remaining protocol considerations

- These checks are not a formal security audit or proof of absence of bugs.
- Report text is not cryptographically bound to CI job stdout; a completed run
  and an evidence report are separate sources. This is disclosed in README.
- Review is public and one-time. If evidence is reviewed while its CI run is
  pending, an INSUFFICIENT result can be permanent for that case; a new revision
  is needed. Use a completed CI run as required by the registration instructions.
- Collection reads currently fetch all records. Very large public registries
  would require pagination/indexing; large-scale availability was not tested.
- Model inference, third-party GitHub availability and StudioNet behavior are
  outside these local test guarantees.
