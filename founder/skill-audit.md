# Founder skills source review and installation

Date: 2026-10-16
Source: https://github.com/emotixco/claude-skills-founder
Reviewed commit: 0602cad0520e4d8cb165bb1c779d7010cfbc5b45
Upstream plugin version: 2.1.4
License: MIT

## Scope and result

Read all 13 SKILL.md files, shared/conventions.md, plugin manifests, license
and repository layout. Scanned instructions for executable commands, secret
collection, automatic uploads, privilege changes and instruction override
patterns. The installed skill directories contain Markdown instructions only.
No executable hook, binary, credential collection or automatic data export was
found in the installed content at this commit. This is a static review of a
pinned version, not an absolute security guarantee for future versions.

The upstream repository also contains shell fixtures for its evaluation suite.
Those fixtures, old command shims, plugin manifests and assets were not installed
or executed. Installation used Codex's trusted skill-installer helper.

## Codex adaptation

All 13 skills were installed under C:/Users/Arlos/.codex/skills/. Each installed
SKILL.md was checked against the reviewed source, normalizing Windows line
endings. The Claude-specific shared-conventions path was replaced by the local
references/conventions.md path. A copy of the conventions, MIT license and
PROVENANCE.json with the upstream commit/path/hash accompanies every skill.

Claude allowed-tools metadata is not treated as a Codex permission boundary.
Normal user authorization and tool sandbox rules still apply. These skills
save project context and output in founder/; confidential business information
should not be automatically published merely because it appears in that folder.
No secrets, customer records or private business figures were supplied here.

## Application to PatchJury

Applied product-brief, mvp-scope and landing-page. Outputs are saved alongside
this report. Applied rules include stating assumptions, defining a specific
maintainer audience, maintaining the existing MVP scope, using actual recorded
proof and never presenting integration examples as customer traction.

Implemented findings:
- More explicit opening description of what the product reviews.
- Direct links to the three existing published test cases, shown only when
  actual contract records and verdicts are loaded.
- Registration prerequisites and clear public/immutable evidence disclosure.
- A metadata description consistent with the actual bounded release gate.

No claim about market size, revenue, customer adoption, time saved or a future
GenLayer points award was invented. Commercial validation remains unestablished.
