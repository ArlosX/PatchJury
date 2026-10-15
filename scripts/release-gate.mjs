#!/usr/bin/env node

/**
 * Read-only CI gate. Run this from the repository being released:
 *   node /path/to/proofrail/scripts/release-gate.mjs CASE_ID path/to/candidate-file
 *
 * The repository's checked-out HEAD and the candidate file's exact bytes must
 * match the immutable source registered in the finalized Proofrail case.
 */
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from 'genlayer-js'
import { studionet } from 'genlayer-js/chains'
import { TransactionHashVariant } from 'genlayer-js/types'

function fail(message) {
  console.error(`PROOFRAIL BLOCKED: ${message}`)
  process.exit(1)
}

function normalize(value) {
  if (value instanceof Map) return Object.fromEntries(Array.from(value, ([key, item]) => [String(key), normalize(item)]))
  if (Array.isArray(value)) return value.map(normalize)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalize(item)]))
  return value
}

const [caseId, candidatePath] = process.argv.slice(2)
const address = process.env.PROOFRAIL_CONTRACT_ADDRESS
const endpoint = process.env.GENLAYER_RPC_URL || 'https://studio.genlayer.com/api'
if (!caseId || !candidatePath) fail('usage: release-gate.mjs CASE_ID path/to/candidate-file')
if (!/^0x[0-9a-fA-F]{40}$/.test(address || '')) fail('set PROOFRAIL_CONTRACT_ADDRESS to the deployed v1 contract')
if (!/^[A-Za-z0-9_-]{1,64}$/.test(caseId)) fail('invalid case ID')

let localHash
let gitHead
let gitOrigin
try {
  localHash = createHash('sha256').update(readFileSync(resolve(candidatePath))).digest('hex')
  gitHead = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim().toLowerCase()
  gitOrigin = execFileSync('git', ['remote', 'get-url', 'origin'], { encoding: 'utf8' }).trim()
} catch (error) {
  fail(`cannot read candidate file, Git HEAD or origin: ${error.message}`)
}

try {
  const client = createClient({ chain: studionet, endpoint })
  const opts = { address, args: [caseId], transactionHashVariant: TransactionHashVariant.LATEST_FINAL }
  const protocol = normalize(await client.readContract({ address, functionName: 'get_protocol', transactionHashVariant: TransactionHashVariant.LATEST_FINAL }))
  if (protocol?.version !== 'proofrail-v1') fail('configured address is not a Proofrail v1 contract')
  const item = normalize(await client.readContract({ ...opts, functionName: 'get_case' }))
  const verdict = normalize(await client.readContract({ ...opts, functionName: 'get_verdict' }))
  if (!item?.case_id || !verdict?.case_id) fail('case or verdict is absent from finalized state')
  if (item.case_id !== caseId || verdict.case_id !== caseId) fail('case ID mismatch')
  if (verdict.case_commitment !== item.commitment) fail('verdict does not refer to this immutable case')
  if (verdict.decision !== 'READY') fail(`decision is ${verdict.decision || 'missing'}`)
  if ([verdict.remediation, verdict.regression, verdict.scope].some((value) => value !== 'PASS')) fail('one or more release criteria did not pass')
  if (verdict.ci_run_url !== item.ci_run_url || verdict.ci_status !== 'completed' || verdict.ci_conclusion !== 'success') fail('CI run witness is missing or unsuccessful')
  if (verdict.ci_head_sha !== gitHead || item.candidate_commit !== gitHead) fail('CI run and candidate commit differ from Git HEAD')
  const normalizedOrigin = gitOrigin.replace(/^git@github\.com:/, 'https://github.com/').replace(/\.git$/, '').toLowerCase()
  if (normalizedOrigin !== item.repo_url.toLowerCase()) fail('Git origin differs from the reviewed repository')
  if (item.candidate_sha256 !== localHash) fail('checked-out candidate file differs from the reviewed bytes')
  const url = new URL(item.candidate_url)
  const match = url.pathname.match(/^\/[^/]+\/[^/]+\/([0-9a-f]{40})\/.+$/)
  if (url.hostname !== 'raw.githubusercontent.com' || !match) fail('case candidate is not pinned to a Git commit')
  if (match[1] !== gitHead) fail(`Git HEAD ${gitHead} does not match reviewed commit ${match[1]}`)
  console.log(`PROOFRAIL READY: ${caseId}`)
  console.log(`Contract: ${address}`)
  console.log(`Commit: ${gitHead}`)
  console.log(`File SHA-256: ${localHash}`)
} catch (error) {
  fail(error instanceof Error ? error.message : String(error))
}
