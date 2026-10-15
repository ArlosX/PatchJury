# PatchJury verification report

Date: 2026-10-16
Contract: 0xDD7c6fa8605d04C366B998e7c9A4BA398F720d94
Network: GenLayer StudioNet

## Automated checks

69 automated tests passed:

- 27 deterministic contract tests: registration, immutable commitments, duplicate IDs, pinned source URLs, path traversal, repository/CI identity, candidate/report commit binding, revision ownership, READY/BLOCKED/INSUFFICIENT classification, failed/pending CI, invalid quotes, changed source bytes, invalid UTF-8, source size limits, duplicate review and validator disagreement.
- 18 client tests: finalized-state reads, successful and unsuccessful receipts, missing wallet, rejected connection, chain switch/add, exact byte fingerprints, HTTP failures, size boundaries, UTF-8 and whitespace rejection.
- 12 input validation tests: complete input, invalid case ID, missing policy/title, mutable branch, repository lookalike, traversal, wrong commit, digest and CI URL.
- 12 release-gate tests: matching READY input allowed; non-READY, unknown criterion, changed commitment, failed CI, wrong commit/file/origin, unpinned source and missing arguments denied.

Contract tests replace GenVM storage, web, prompt and consensus APIs with controlled doubles. Client and release-gate tests also replace network/wallet I/O. These tests establish deterministic behavior; they do not demonstrate real multi-validator agreement or real wallet signing.

Commands:

```sh
npm test
python -m unittest discover -s tests -p "test_*.py" -v
npm run build
npm run schema:check
```

## Live checks

- StudioNet accepted the current contract source schema; all 7 public methods were returned.
- Deployed contract get_protocol returned patchjury-v1 / release-judge-v1.
- Finalized get_cases and get_verdicts both returned empty objects. No live case or verdict was available for end-to-end testing.
- Browser connected to StudioNet and displayed the same empty state.
- Real commit-pinned public GitHub sources were fetched through the browser and all three SHA-256 fields populated successfully.
- Changing a source URL cleared its previous digest.

## Browser checks

Verified review/protocol/pipeline navigation, empty-state search and status-filter selection, composer opening, initial focus, Shift+Tab trapping, Escape/close, background scroll lock, blocking invalid registration before wallet access, empty-source validation, field locking during fingerprinting, source hashing and invalidation, and skip-to-board navigation. No warning/error console entries were observed in the inspected run. No horizontal overflow was observed at the available desktop viewport.

Search/filter behavior with populated onchain data and mobile viewport rendering remain unverified. The in-app viewport override did not take effect in the earlier responsive inspection.

## Defects corrected during this pass

- Repository names containing dots were interpolated into a regex without escaping. Source/CI validation now compares parsed repository components literally.
- Missing client validation for case ID and parent-directory source paths now blocks invalid submissions before opening the wallet.
- Inputs could change while fingerprint requests were running, allowing hashes for earlier URLs to be attached to newer form values. Inputs now lock during fingerprinting/submission; editing a source clears its hash.
- Registration is disabled during fingerprinting; starting another request and refresh are disabled during an active write.
- Source fetch has a 20-second timeout and rejects binary/whitespace-only input.
- Skip navigation now returns to the review view; secondary views have page headings and display notices.

## Final manual acceptance

1. Open the deployed site in Chrome with your wallet. Confirm StudioNet connected. Check a narrow mobile viewport for clipping and menu usability.
2. Use an actual public repository with a completed GitHub Actions run. Collect baseline/candidate raw URLs pinned to full 40-character commits. Candidate and detailed test report must share a commit; the CI run must belong to that repository and candidate commit. Files must be UTF-8, nonempty and no larger than 12 KB.
3. Create a review, enter an explicit release policy and those URLs, then Fetch & fingerprint sources. Check the hashes, register and approve in the wallet. Record the transaction hash; wait for FINALIZED.
4. Confirm the case appears, refresh the page, reopen its evidence and check the case ID, hashes, policy and repository against the submitted data.
5. Run GenLayer review and approve in the wallet. Wait for finalized execution. Check the recorded criteria, quotes and CI witness; the actual verdict may be READY, BLOCKED or INSUFFICIENT based on evidence and validator judgment.
6. Search the case by title, ID and repository; use its actual status filter. Refresh and verify its verdict persists. Open the shared ?case= link in a new tab.
7. Submit a linked revision and confirm the parent case remains unchanged. In StudioNet, test a clearly failing CI case and incomplete-evidence case to observe BLOCKED/INSUFFICIENT without fabricating results.
8. Run the gate from the reviewed repository checkout: exact commit and file with finalized READY should exit 0; changing the candidate file should exit 1. Record both outputs and transaction links for submission evidence.

No transactions were sent during this verification pass. Successful live registration, GenVM execution, multi-validator review, finalized receipt rendering, and release-gate integration with an actual recorded verdict require the steps above.
