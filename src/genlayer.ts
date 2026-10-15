import { TransactionHashVariant, type CalldataEncodable } from "genlayer-js/types"

export const contractAddress = import.meta.env.VITE_PATCHJURY_CONTRACT_ADDRESS || ""
export const rpcEndpoint = import.meta.env.VITE_GENLAYER_RPC_URL || "https://studio.genlayer.com/api"
const chainId = 61999

export type Criterion = "PASS" | "FAIL" | "UNKNOWN"
export type Decision = "READY" | "BLOCKED" | "INSUFFICIENT"

export type ReleaseCase = {
  case_id: string
  title: string
  repo_url: string
  release_policy: string
  baseline_url: string
  baseline_sha256: string
  candidate_url: string
  candidate_sha256: string
  test_report_url: string
  test_report_sha256: string
  ci_run_url: string
  candidate_commit: string
  parent_id: string
  author: string
  created_at: string
  commitment: string
}

export type Verdict = {
  case_id: string
  case_commitment: string
  decision: Decision
  remediation: Criterion
  regression: Criterion
  scope: Criterion
  candidate_quote: string
  test_quote: string
  reason: string
  prompt_version: string
  ci_run_url: string
  ci_status: string
  ci_conclusion: string
  ci_head_sha: string
  reviewer: string
  created_at: string
}

export type Protocol = { version: string; prompt_version: string }
export type CaseInput = Pick<ReleaseCase,
  "case_id" | "title" | "repo_url" | "release_policy" |
  "baseline_url" | "baseline_sha256" | "candidate_url" | "candidate_sha256" |
  "test_report_url" | "test_report_sha256" | "ci_run_url" | "parent_id"
>

interface EthereumProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>
}

declare global {
  interface Window { ethereum?: EthereumProvider }
}

export const validAddress = (value: string): value is `0x${string}` => /^0x[a-fA-F0-9]{40}$/.test(value)

function provider(): EthereumProvider {
  if (!window.ethereum) throw new Error("Install an EVM wallet to submit a GenLayer transaction.")
  return window.ethereum
}

export async function currentAccount(): Promise<string> {
  if (!window.ethereum) return ""
  const accounts = await window.ethereum.request({ method: "eth_accounts" }) as string[]
  return accounts?.[0] || ""
}

export async function connectWallet(): Promise<string> {
  const wallet = provider()
  const accounts = await wallet.request({ method: "eth_requestAccounts" }) as string[]
  if (!accounts?.[0]) throw new Error("Select a wallet account to continue.")
  const expected = `0x${chainId.toString(16)}`
  const current = await wallet.request({ method: "eth_chainId" }) as string
  if (current.toLowerCase() !== expected.toLowerCase()) {
    try {
      await wallet.request({ method: "wallet_switchEthereumChain", params: [{ chainId: expected }] })
    } catch (error) {
      if ((error as { code?: number }).code !== 4902) throw error
      await wallet.request({
        method: "wallet_addEthereumChain",
        params: [{
          chainId: expected,
          chainName: "GenLayer StudioNet",
          nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
          rpcUrls: [rpcEndpoint],
        }],
      })
    }
  }
  return accounts[0]
}

function normalize(value: unknown): unknown {
  if (value instanceof Map) return Object.fromEntries(Array.from(value, ([key, item]) => [String(key), normalize(item)]))
  if (Array.isArray(value)) return value.map(normalize)
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalize(item)]))
  return value
}

type StudioReceipt = {
  status?: string | number
  statusName?: string
  status_name?: string
  txExecutionResultName?: string
  consensus_data?: {
    leader_receipt?: Array<{
      execution_result?: string
      result?: { status?: string }
      genvm_result?: { error_code?: string | null }
    }>
  }
}

function successfulReturn(receipt: StudioReceipt): boolean {
  if (receipt.txExecutionResultName) return receipt.txExecutionResultName === "FINISHED_WITH_RETURN"
  return receipt.consensus_data?.leader_receipt?.some((item) =>
    item.execution_result === "SUCCESS" && item.result?.status === "return" && !item.genvm_result?.error_code,
  ) === true
}

export class PatchJuryClient {
  private readonly address: `0x${string}`
  private readonly clientPromise: Promise<ReturnType<(typeof import("genlayer-js"))["createClient"]>>

  constructor(account?: string) {
    if (!validAddress(contractAddress)) throw new Error("PatchJury contract is not configured yet.")
    this.address = contractAddress
    this.clientPromise = Promise.all([import("genlayer-js"), import("genlayer-js/chains")]).then(([sdk, chains]) =>
      sdk.createClient({ chain: chains.studionet, endpoint: rpcEndpoint, ...(account ? { account: account as `0x${string}` } : {}) }),
    )
  }

  private async read(functionName: string, args: CalldataEncodable[] = []): Promise<unknown> {
    const client = await this.clientPromise
    return normalize(await client.readContract({ address: this.address, functionName, args, transactionHashVariant: TransactionHashVariant.LATEST_FINAL }))
  }

  private async write(functionName: string, args: CalldataEncodable[], onSubmitted: (hash: string) => void): Promise<string> {
    const client = await this.clientPromise
    const hash = await client.writeContract({ address: this.address, functionName, args, value: 0n })
    onSubmitted(String(hash))
    const receipt = await client.waitForTransactionReceipt({ hash, status: "FINALIZED" as never, retries: 120, interval: 5000 }) as StudioReceipt
    const status = String(receipt.status_name || receipt.statusName || receipt.status || "UNKNOWN").toUpperCase()
    if (status !== "FINALIZED" || !successfulReturn(receipt)) {
      throw new Error(`Transaction ${hash} did not finish successfully (${status}). Inspect it before retrying.`)
    }
    return String(hash)
  }

  protocol(): Promise<Protocol> { return this.read("get_protocol") as Promise<Protocol> }

  async cases(): Promise<ReleaseCase[]> {
    const value = await this.read("get_cases") as Record<string, ReleaseCase>
    return Object.values(value || {}).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
  }

  async verdicts(): Promise<Record<string, Verdict>> {
    return await this.read("get_verdicts") as Record<string, Verdict>
  }

  async case(caseId: string): Promise<ReleaseCase> {
    return this.read("get_case", [caseId]) as Promise<ReleaseCase>
  }

  async verdict(caseId: string): Promise<Verdict | null> {
    const result = await this.read("get_verdict", [caseId]) as Partial<Verdict>
    return result?.case_id ? result as Verdict : null
  }

  register(input: CaseInput, onSubmitted: (hash: string) => void): Promise<string> {
    return this.write("register_case", [
      input.case_id, input.title, input.repo_url, input.release_policy,
      input.baseline_url, input.baseline_sha256, input.candidate_url,
      input.candidate_sha256, input.test_report_url, input.test_report_sha256,
      input.ci_run_url, input.parent_id,
    ], onSubmitted)
  }

  review(caseId: string, onSubmitted: (hash: string) => void): Promise<string> {
    return this.write("review_case", [caseId], onSubmitted)
  }
}

export async function sha256FromUrl(url: string): Promise<string> {
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(20000) })
  if (!response.ok) throw new Error(`Source returned HTTP ${response.status}: ${url}`)
  const bytes = await response.arrayBuffer()
  if (bytes.byteLength === 0 || bytes.byteLength > 12000) throw new Error("Source must contain 1–12,000 bytes.")
  let text: string
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(bytes) }
  catch { throw new Error("Source must be valid UTF-8 text.") }
  if (!text.trim()) throw new Error("Source must contain non-whitespace text.")
  const hash = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("")
}
