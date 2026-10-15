import type { CaseInput } from "./genlayer"

const keys = ["baseline", "candidate", "test_report"] as const
const labels = { baseline: "Baseline code", candidate: "Candidate code", test_report: "Test evidence" }
const sourcePattern = /^https:\/\/raw\.githubusercontent\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/([0-9a-f]{40})\/([A-Za-z0-9_./-]+)$/

export function validateSources(input: CaseInput): string | null {
  const repo = input.repo_url.match(/^https:\/\/github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/)
  if (!repo) return "Repository must use https://github.com/OWNER/REPO."
  for (const key of keys) {
    const url = input[`${key}_url`]
    const match = url.match(sourcePattern)
    if (url.length > 500 || !match || match[1].toLowerCase() !== repo[1].toLowerCase() || match[2].toLowerCase() !== repo[2].toLowerCase() || match[4].split("/").includes("..")) {
      return `${labels[key]} needs a commit-pinned raw URL from the declared repository, without parent-directory paths.`
    }
  }
  if (input.candidate_url.match(sourcePattern)![3] !== input.test_report_url.match(sourcePattern)![3]) return "Test evidence and candidate code must use the same Git commit."
  return null
}

export function validateCaseInput(input: CaseInput): string | null {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(input.case_id)) return "Case ID must contain 1–64 letters, numbers, underscores or hyphens."
  if (!input.title.trim() || input.title.length > 160 || !input.release_policy.trim() || input.release_policy.length > 1500) return "Add a release title (up to 160 characters) and policy (up to 1,500 characters)."
  const sourceError = validateSources(input)
  if (sourceError) return sourceError
  for (const key of keys) if (!/^[0-9a-f]{64}$/.test(input[`${key}_sha256`])) return `${labels[key]} needs a lowercase SHA-256 fingerprint.`
  const repo = input.repo_url.split("/").slice(-2).join("/").toLowerCase()
  const ci = input.ci_run_url.match(/^https:\/\/api\.github\.com\/repos\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)\/actions\/runs\/[0-9]+$/)
  if (input.ci_run_url.length > 500 || !ci || ci[1].toLowerCase() !== repo) return "Add the GitHub Actions API URL for a run in the declared repository."
  return null
}
