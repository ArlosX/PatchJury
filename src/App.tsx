import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, CircleAlert,
  CircleCheck, CircleHelp, CircleX, ClipboardCheck, ExternalLink, FileCode2,
  Fingerprint, GitBranch, LockKeyhole, Menu, Plus, RefreshCw, ShieldCheck,
  X,
} from "lucide-react"
import {
  connectWallet, contractAddress, currentAccount, PatchJuryClient, sha256FromUrl,
  validAddress, type CaseInput, type Criterion, type Decision, type ReleaseCase,
  type Verdict,
} from "./genlayer"

type Connection = "unconfigured" | "checking" | "ready" | "error"
type Notice = { kind: "info" | "error" | "success"; text: string }
type SourceKey = "baseline" | "candidate" | "test_report"

const sourceKeys: SourceKey[] = ["baseline", "candidate", "test_report"]
const sourceLabels: Record<SourceKey, string> = {
  baseline: "Baseline code",
  candidate: "Candidate code",
  test_report: "Test evidence",
}

function newCaseId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  return `REL-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("").toUpperCase()}`
}

function initialForm(): CaseInput {
  return {
    case_id: newCaseId(), title: "", repo_url: "", release_policy: "",
    baseline_url: "", baseline_sha256: "", candidate_url: "", candidate_sha256: "",
    test_report_url: "", test_report_sha256: "", ci_run_url: "", parent_id: "",
  }
}

function short(value: string, lead = 7, tail = 5): string {
  return value.length > lead + tail + 3 ? `${value.slice(0, lead)}…${value.slice(-tail)}` : value
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function decisionLabel(decision?: Decision): string {
  return decision || "AWAITING REVIEW"
}

function DecisionBadge({ decision }: { decision?: Decision }) {
  return <span className={`decision-badge ${decision ? decision.toLowerCase() : "waiting"}`}>
    <span className="badge-dot" />{decisionLabel(decision)}
  </span>
}

function CriterionRow({ label, value, detail }: { label: string; value?: Criterion; detail: string }) {
  const Icon = value === "PASS" ? CircleCheck : value === "FAIL" ? CircleX : CircleHelp
  return <div className="criterion-row">
    <Icon size={20} className={`criterion-icon ${(value || "unknown").toLowerCase()}`} aria-hidden="true" />
    <div><strong>{label}</strong><span>{detail}</span></div>
    <b className={`criterion-value ${(value || "unknown").toLowerCase()}`}>{value || "PENDING"}</b>
  </div>
}

function PatchJuryMark() {
  return <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
}

function App() {
  const [connection, setConnection] = useState<Connection>(validAddress(contractAddress) ? "checking" : "unconfigured")
  const [account, setAccount] = useState("")
  const [cases, setCases] = useState<ReleaseCase[]>([])
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({})
  const [selectedId, setSelectedId] = useState(() => new URLSearchParams(window.location.search).get("case") || "")
  const [showComposer, setShowComposer] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [form, setForm] = useState<CaseInput>(initialForm)
  const [fingerprinting, setFingerprinting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [txHash, setTxHash] = useState("")
  const [notice, setNotice] = useState<Notice | null>(null)
  const composerRef = useRef<HTMLElement>(null)
  const modalLocked = useRef(false)
  modalLocked.current = busy || fingerprinting

  useEffect(() => {
    if (!showComposer) return
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const frame = requestAnimationFrame(() => composerRef.current?.querySelector<HTMLInputElement>("input")?.focus())
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !modalLocked.current) setShowComposer(false)
      if (event.key !== "Tab") return
      const nodes = composerRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')
      if (!nodes?.length) return
      const first = nodes[0], last = nodes[nodes.length - 1]
      if (event.shiftKey && (document.activeElement === first || !composerRef.current?.contains(document.activeElement))) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener("keydown", onKey)
    return () => { cancelAnimationFrame(frame); document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKey); previousFocus?.focus() }
  }, [showComposer])

  const selected = useMemo(() => cases.find((item) => item.case_id === selectedId), [cases, selectedId])
  const verdict = selected ? verdicts[selected.case_id] : undefined
  const readyCount = cases.filter((item) => verdicts[item.case_id]?.decision === "READY").length

  const refresh = useCallback(async () => {
    if (!validAddress(contractAddress)) { setConnection("unconfigured"); return }
    setConnection("checking")
    try {
      const client = new PatchJuryClient()
      const protocol = await client.protocol()
      if (protocol.version !== "patchjury-v1") throw new Error("The configured address is not a PatchJury v1 contract.")
      const [nextCases, nextVerdicts] = await Promise.all([client.cases(), client.verdicts()])
      setCases(nextCases)
      setVerdicts(nextVerdicts)
      setSelectedId((current) => nextCases.some((item) => item.case_id === current) ? current : nextCases[0]?.case_id || "")
      setConnection("ready")
      setNotice((current) => current?.kind === "error" ? null : current)
    } catch (error) {
      setConnection("error")
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Contract could not be read." })
    }
  }, [])

  useEffect(() => {
    void refresh()
    void currentAccount().then(setAccount).catch(() => undefined)
  }, [refresh])

  useEffect(() => {
    const url = new URL(window.location.href)
    if (selectedId) url.searchParams.set("case", selectedId)
    else url.searchParams.delete("case")
    window.history.replaceState(null, "", url)
  }, [selectedId])

  const updateForm = (field: keyof CaseInput, value: string) => setForm((current) => ({ ...current, [field]: value }))

  async function ensureAccount(): Promise<string> {
    // Recheck the active wallet and chain before every write. An already
    // connected account may have switched networks after the page loaded.
    const next = await connectWallet()
    setAccount(next)
    return next
  }

  async function fingerprintSources() {
    setFingerprinting(true)
    setNotice(null)
    try {
      const hashes = await Promise.all(sourceKeys.map((key) => sha256FromUrl(form[`${key}_url`])))
      setForm((current) => ({
        ...current,
        baseline_sha256: hashes[0], candidate_sha256: hashes[1], test_report_sha256: hashes[2],
      }))
      setNotice({ kind: "success", text: "All three public files were fetched and fingerprinted. Review the hashes before registering." })
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Could not fingerprint sources." })
    } finally {
      setFingerprinting(false)
    }
  }

  function validateForm(): string | null {
    if (!form.title.trim() || !form.release_policy.trim()) return "Add a title and release policy."
    if (!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(form.repo_url)) return "Repository must use https://github.com/OWNER/REPO."
    const [, owner, repo] = form.repo_url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)$/) || []
    for (const key of sourceKeys) {
      const url = form[`${key}_url`]
      const hash = form[`${key}_sha256`]
      const pattern = new RegExp(`^https://raw\\.githubusercontent\\.com/${owner}/${repo}/[0-9a-f]{40}/[A-Za-z0-9_./-]+$`, "i")
      if (!pattern.test(url)) return `${sourceLabels[key]} needs a commit-pinned raw URL from the declared repository.`
      if (!/^[0-9a-f]{64}$/.test(hash)) return `${sourceLabels[key]} needs a lowercase SHA-256 fingerprint.`
    }
    const commitFrom = (url: string) => url.match(/^https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/([0-9a-f]{40})\//)?.[1]
    if (commitFrom(form.test_report_url) !== commitFrom(form.candidate_url)) return "Test evidence and candidate code must use the same Git commit."
    const ciPattern = new RegExp(`^https://api\\.github\\.com/repos/${owner}/${repo}/actions/runs/[0-9]+$`, "i")
    if (!ciPattern.test(form.ci_run_url)) return "Add the GitHub Actions API URL for the candidate commit's run."
    return null
  }

  async function register() {
    const error = validateForm()
    if (error) { setNotice({ kind: "error", text: error }); return }
    setBusy(true); setTxHash(""); setNotice(null)
    try {
      const wallet = await ensureAccount()
      const client = new PatchJuryClient(wallet)
      await client.register(form, setTxHash)
      setShowComposer(false)
      setNotice({ kind: "success", text: "Release request finalized on GenLayer. Its evidence and policy are now fixed." })
      setSelectedId(form.case_id)
      setForm(initialForm())
      await refresh()
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Registration failed." })
    } finally {
      setBusy(false)
    }
  }

  async function runReview() {
    if (!selected) return
    setBusy(true); setTxHash(""); setNotice(null)
    try {
      const wallet = await ensureAccount()
      const client = new PatchJuryClient(wallet)
      await client.review(selected.case_id, setTxHash)
      setNotice({ kind: "success", text: "The GenLayer review finalized. The receipt is now in the release board." })
      await refresh()
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Review failed." })
    } finally {
      setBusy(false)
    }
  }

  function startRevision(item: ReleaseCase) {
    setForm({
      case_id: newCaseId(), title: item.title, repo_url: item.repo_url,
      release_policy: item.release_policy, baseline_url: item.baseline_url,
      baseline_sha256: item.baseline_sha256, candidate_url: "", candidate_sha256: "",
      test_report_url: "", test_report_sha256: "", ci_run_url: "", parent_id: item.case_id,
    })
    setShowComposer(true)
    setNotice(null)
  }

  return <>
    <div className="site-shell" inert={showComposer}>
      <a className="skip-link" href="#release-board">Skip to release board</a>
      <header className="site-header">
        <a href="#top" className="brand" aria-label="PatchJury home"><PatchJuryMark /><span>patchjury<span className="brand-period">.</span></span></a>
        <button className="mobile-menu-btn" aria-label="Toggle navigation" aria-expanded={mobileMenu} onClick={() => setMobileMenu(!mobileMenu)}><Menu size={23} /></button>
        <nav className={mobileMenu ? "nav-open" : ""} aria-label="Primary">
          <a href="#workflow" onClick={() => setMobileMenu(false)}>The method</a>
          <a href="#release-board" onClick={() => setMobileMenu(false)}>Release board</a>
          <a href="#integrate" onClick={() => setMobileMenu(false)}>CI gate</a>
        </nav>
        <div className="header-actions">
          <span className={`network-label ${connection}`}><span className="network-pip" />{connection === "ready" ? "STUDIONET LIVE" : connection === "checking" ? "CONNECTING" : connection === "error" ? "NETWORK ERROR" : "DEPLOYMENT PENDING"}</span>
          <button className="wallet-button" onClick={() => { void connectWallet().then(setAccount).catch((error) => setNotice({ kind: "error", text: error.message })) }}>
            {account ? short(account) : "Connect wallet"}<ArrowUpRight size={15} aria-hidden="true" />
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> THE RELEASE ASSURANCE WORKSPACE</div>
            <h1 id="hero-title">Fast patches.<br /><em>Considered releases.</em></h1>
            <p>Give agent-written code an independent review. Pin the evidence, assess the change through GenLayer, and bring a verifiable decision into your release pipeline.</p>
            <div className="hero-actions"><a href="#release-board" className="button button-primary">Inspect releases <ArrowRight size={18} /></a><a href="#workflow" className="text-link">See how judgment works <ArrowDown size={17} /></a></div>
            <div className="hero-footnote"><ShieldCheck size={17} /> Independent validator assessment. Commit-pinned evidence. A decision your pipeline can read.</div>
          </div>
          <div className="hero-art" aria-label="Illustrated review workflow, not a live case">
            <div className="art-topline"><span><GitBranch size={15} /> REVIEW ARCHITECTURE</span><span className="diagram-label">WORKFLOW</span></div>
            <div className="evidence-stack">
              <div className="evidence-stack-head"><span>01 / EVIDENCE BUNDLE</span><LockKeyhole size={14} /></div>
              <div className="diagram-file"><FileCode2 size={18} /><span>Baseline <small>Original implementation</small></span><code>SHA-256</code></div>
              <div className="diagram-file candidate"><GitBranch size={18} /><span>Candidate <small>Commit-pinned change</small></span><code>SHA-256</code></div>
              <div className="diagram-file"><ClipboardCheck size={18} /><span>Test evidence <small>Report + GitHub Actions run</small></span><code>CI</code></div>
            </div>
            <div className="diagram-connector"><span /><ArrowDown size={15} /><span>Bound to a release policy</span></div>
            <div className="judgment-engine"><div className="engine-icon"><ShieldCheck size={26} /></div><div><span>02 / INDEPENDENT ASSESSMENT</span><strong>GenLayer judgment</strong><p>Remediation · Regression · Scope</p></div><Fingerprint size={32} className="engine-fingerprint" /></div>
            <div className="diagram-connector"><span /><ArrowDown size={15} /><span>Recorded onchain</span></div>
            <div className="diagram-outcomes"><span>03 / DECISION</span><div><span className="outcome-ready">READY</span><span className="outcome-blocked">BLOCKED</span><span>INSUFFICIENT</span></div></div>
            <div className="art-bottomline"><span>ONE CASE. TRACEABLE EVIDENCE.</span><span>PROTOCOL V1</span></div>
          </div>
        </section>

        <div className="ticker"><span><Fingerprint size={17} /> Commit-pinned sources</span><span><GitBranch size={17} /> Independent assessment</span><span><LockKeyhole size={17} /> Immutable case records</span><span><ClipboardCheck size={17} /> CI-readable decisions</span></div>

        <section className="workflow section-wrap" id="workflow" aria-labelledby="workflow-title">
          <div className="section-heading"><span className="section-index">01 / THE METHOD</span><h2 id="workflow-title">From agent output<br />to release decision.</h2><p>Three commit-pinned files and a GitHub Actions run form one versioned review. The decision happens inside the Intelligent Contract, where validators independently repeat the assessment.</p></div>
          <div className="workflow-grid">
            <article className="workflow-card"><div className="card-number">01</div><FileCode2 size={29} strokeWidth={1.7} /><h3>Fix the evidence</h3><p>Register the policy, baseline, candidate, test report and CI run. Every file points to a Git commit and carries its SHA-256 fingerprint.</p><span className="card-caption">IMMUTABLE INPUTS</span></article>
            <article className="workflow-card"><div className="card-number">02</div><GitBranch size={29} strokeWidth={1.7} /><h3>Judge the change</h3><p>GenLayer reads the files and CI run. Validators independently assess remediation, regression evidence and scope against the same policy.</p><span className="card-caption">INDEPENDENT ASSESSMENT</span></article>
            <article className="workflow-card"><div className="card-number">03</div><ClipboardCheck size={29} strokeWidth={1.7} /><h3>Gate the release</h3><p>The contract records READY, BLOCKED or INSUFFICIENT. A CI command accepts only a finalized READY receipt for the exact case.</p><span className="card-caption">ACTIONABLE RECEIPT</span></article>
          </div>
        </section>

        <section className="board-section" id="release-board" aria-labelledby="board-title">
          <div className="section-wrap">
            <div className="board-heading"><div><span className="section-index">02 / LIVE CONTRACT STATE</span><h2 id="board-title">Release board<span>.</span></h2></div><div className="board-tools"><span>{connection === "ready" ? String(cases.length).padStart(2, "0") : "—"} requests <span className="tool-separator">/</span> {connection === "ready" ? String(readyCount).padStart(2, "0") : "—"} ready</span><button className="icon-button" title="Refresh contract state" aria-label="Refresh contract state" disabled={connection === "checking"} onClick={() => void refresh()}><RefreshCw size={18} /></button><button className="button button-dark" onClick={() => { setForm(initialForm()); setShowComposer(true) }}><Plus size={18} /> New review</button></div></div>

            {connection !== "ready" && <div className="state-banner"><CircleAlert size={19} /><div><strong>{connection === "unconfigured" ? "Contract deployment is pending" : connection === "checking" ? "Reading StudioNet" : "Could not read the contract"}</strong><p>{connection === "unconfigured" ? "The interface is ready for a GenLayer address. No onchain release results are shown until a matching contract is deployed." : connection === "checking" ? "Loading the protocol version and published receipts." : "Check the RPC connection and the configured contract address, then refresh."}</p></div></div>}

            {notice && <div role="status" className={`notice ${notice.kind}`}><span>{notice.text}</span><button aria-label="Dismiss message" onClick={() => setNotice(null)}><X size={17} /></button></div>}
            {txHash && <div className="tx-note"><span>TRANSACTION</span><code>{txHash}</code><span>Follow this hash until finalization. Do not resubmit while it is pending.</span></div>}

            <div className="board-layout">
              <div className="case-list" aria-label="Release requests">
                <div className="list-label"><span>REQUESTS</span><span>{String(cases.length).padStart(2, "0")}</span></div>
                {cases.length ? cases.map((item, index) => <button key={item.case_id} className={`case-row ${item.case_id === selectedId ? "active" : ""}`} aria-pressed={item.case_id === selectedId} onClick={() => setSelectedId(item.case_id)}>
                  <span className="row-counter">{String(index + 1).padStart(2, "0")}</span><span className="row-main"><strong>{item.title}</strong><small>{item.repo_url.replace("https://github.com/", "")}</small></span><span className={`row-status ${verdicts[item.case_id]?.decision?.toLowerCase() || "waiting"}`} /><ArrowRight size={17} className="row-arrow" />
                </button>) : <div className="case-empty"><div className="empty-symbol"><LockKeyhole size={24} /></div><strong>{connection === "ready" ? "No release requests yet" : "Waiting for contract data"}</strong><p>{connection === "ready" ? "Register the first commit-pinned case to begin. Only onchain records appear here." : "Records will appear when the contract connection is restored. You can prepare a new request in the meantime."}</p></div>}
              </div>

              <div className="case-detail">
                {selected ? <>
                  <div className="detail-head"><span className="detail-kicker">CASE FILE / {selected.case_id}</span><DecisionBadge decision={verdict?.decision} /></div>
                  <h3>{selected.title}</h3><p className="detail-subtitle">{verdict ? "Consensus-backed assessment of a committed release candidate." : "The evidence is fixed. The case is waiting for its first consensus review."}</p>
                  <div className="detail-meta"><span>SUBMITTED {formatDate(selected.created_at)}</span><span>BY {short(selected.author)}</span>{selected.parent_id && <span>REVISION OF {selected.parent_id}</span>}</div>
                  <div className="criteria-box"><CriterionRow label="Remediation" value={verdict?.remediation} detail="Does the candidate solve the promised change?" /><CriterionRow label="Regression evidence" value={verdict?.regression} detail="Are required tests credibly documented?" /><CriterionRow label="Scope control" value={verdict?.scope} detail="Did the change stay within its approved boundary?" /></div>
                  {verdict && <div className="verdict-reason"><span>RECORDED REASON</span><p>{verdict.reason}</p><div className="quote-grid"><blockquote><span>CANDIDATE EXCERPT</span>{verdict.candidate_quote || "No excerpt supplied."}</blockquote><blockquote><span>TEST EXCERPT</span>{verdict.test_quote || "No excerpt supplied."}</blockquote></div></div>}
                  <details className="evidence-details"><summary>Inspect locked evidence <ChevronDown size={17} /></summary><div><p><strong>Policy</strong><br />{selected.release_policy}</p><a href={selected.baseline_url} target="_blank" rel="noreferrer">Baseline source <ExternalLink size={14} /></a><code>SHA-256 {selected.baseline_sha256}</code><a href={selected.candidate_url} target="_blank" rel="noreferrer">Candidate source <ExternalLink size={14} /></a><code>SHA-256 {selected.candidate_sha256}</code><a href={selected.test_report_url} target="_blank" rel="noreferrer">Test report <ExternalLink size={14} /></a><code>SHA-256 {selected.test_report_sha256}</code><a href={selected.ci_run_url.replace("api.github.com/repos/", "github.com/")} target="_blank" rel="noreferrer">GitHub Actions run <ExternalLink size={14} /></a><code>COMMIT {selected.candidate_commit}</code>{verdict && <code>CI {verdict.ci_status.toUpperCase()} / {verdict.ci_conclusion.toUpperCase()}</code>}<span className="commitment">CASE COMMITMENT {selected.commitment}</span></div></details>
                  <div className="detail-actions"><a href={selected.repo_url} target="_blank" rel="noreferrer" className="quiet-link">Open repository <ArrowUpRight size={15} /></a>{!verdict && <button className="button button-primary" onClick={() => void runReview()} disabled={busy || connection !== "ready"}>{busy ? "Waiting for finality…" : "Run GenLayer review"}<ArrowRight size={17} /></button>}{verdict && <button className="button button-outline" onClick={() => startRevision(selected)}>Submit revision <ArrowRight size={16} /></button>}</div>
                </> : <div className="detail-placeholder"><div className="placeholder-graphic" aria-hidden="true"><FileCode2 size={28} /><span /><ShieldCheck size={32} /><span /><ClipboardCheck size={28} /></div><span className="detail-kicker">YOUR NEXT RELEASE STARTS HERE</span><h3>A clear record.<br />For a considered decision.</h3><p>{cases.length ? "Select a case to inspect its evidence and recorded assessment." : "Start with a policy, two code snapshots and test evidence. Your first review will appear here once it is registered onchain."}</p><div className="empty-checklist"><span><Check size={14} /> Commit-pinned files</span><span><Check size={14} /> Public CI run</span></div></div>}
              </div>
            </div>
          </div>
        </section>

        <section className="integrate section-wrap" id="integrate" aria-labelledby="integrate-title"><div className="integrate-copy"><span className="section-index">03 / THE CONSEQUENCE</span><h2 id="integrate-title">Let the pipeline<br />read the verdict.</h2><p>PatchJury ships a small release-gate command. Point it at a case ID and the deployed contract. It reads finalized state and exits with a failure code unless the exact commit and CI run have a READY verdict.</p><div className="integrate-note"><CircleAlert size={18} /> It gates a configured CI workflow. It does not control repositories that have not adopted the gate.</div></div><div className="code-card"><div className="code-top"><span><span className="code-dot" /> RELEASE-GATE.MJS</span><span>CI / VERIFY</span></div><pre><code><span className="code-comment"># In your release workflow</span>{"\n"}PATCHJURY_CONTRACT_ADDRESS=<span className="code-orange">0x…</span> \{"\n"}  npm run gate -- <span className="code-orange">REL-CASE-ID path/to/candidate-file</span>{"\n\n"}<span className="code-comment"># READY + finalized → exit 0</span>{"\n"}<span className="code-comment"># BLOCKED / INSUFFICIENT → exit 1</span></code></pre><div className="code-bottom"><Check size={16} /> No private key needed for the read-only gate</div></div></section>
      </main>
      <footer className="footer"><div className="footer-brand"><PatchJuryMark /> patchjury.</div><p>Release decisions with receipts. Built on GenLayer.</p><span>PROTOCOL V1 / PUBLIC EVIDENCE ONLY</span></footer>
    </div>

    {showComposer && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy && !fingerprinting) setShowComposer(false) }}><section ref={composerRef} className="composer" role="dialog" aria-modal="true" aria-labelledby="composer-title"><div className="composer-head"><div><span className="detail-kicker">NEW RELEASE REQUEST</span><h2 id="composer-title">Pin the promise.<br />Pin the proof.</h2></div><button className="icon-button" aria-label="Close request form" disabled={busy || fingerprinting} onClick={() => setShowComposer(false)}><X size={22} /></button></div><p className="composer-intro">The case can be reviewed once. To change evidence or policy later, submit a linked revision.</p><div className="form-grid"><label className="form-field"><span>Release title</span><input value={form.title} maxLength={160} onChange={(event) => updateForm("title", event.target.value)} placeholder="Patch parser boundary in v2.4" /></label><label className="form-field"><span>Case ID</span><input value={form.case_id} maxLength={64} onChange={(event) => updateForm("case_id", event.target.value)} /></label><label className="form-field full"><span>GitHub repository</span><input value={form.repo_url} onChange={(event) => updateForm("repo_url", event.target.value)} placeholder="https://github.com/owner/repository" /></label><label className="form-field full"><span>Release policy / promised outcome</span><textarea value={form.release_policy} maxLength={1500} onChange={(event) => updateForm("release_policy", event.target.value)} placeholder="Specify the required fix, tests that must pass, and changes that must stay out of scope." rows={5} /><small>{form.release_policy.length}/1500 characters</small></label>{sourceKeys.map((key, index) => <div className="source-form" key={key}><div className="source-form-title"><span>0{index + 1}</span><strong>{sourceLabels[key]}</strong></div><label className="form-field"><span>Commit-pinned raw URL</span><input value={form[`${key}_url`]} onChange={(event) => updateForm(`${key}_url`, event.target.value)} placeholder="https://raw.githubusercontent.com/owner/repo/40-char-commit/path" /></label><label className="form-field"><span>SHA-256</span><input value={form[`${key}_sha256`]} onChange={(event) => updateForm(`${key}_sha256`, event.target.value.toLowerCase())} placeholder="Fetch automatically or paste lowercase digest" /></label></div>)}<label className="form-field full"><span>GitHub Actions run API URL</span><input value={form.ci_run_url} onChange={(event) => updateForm("ci_run_url", event.target.value)} placeholder="https://api.github.com/repos/owner/repo/actions/runs/123456" /><small>Use a completed run for the candidate commit. The run and candidate must belong to the repository above.</small></label></div><div className="composer-bottom"><div><button className="button button-outline" onClick={() => void fingerprintSources()} disabled={fingerprinting || busy}>{fingerprinting ? "Fingerprinting…" : "Fetch & fingerprint sources"}<Fingerprint size={17} /></button><p>Files must be public UTF-8 text, at most 12 KB each. Candidate and report must use the same 40-character commit SHA.</p></div><button className="button button-primary" onClick={() => void register()} disabled={busy || connection !== "ready"}>{busy ? "Waiting for finality…" : "Register on GenLayer"}<ArrowRight size={17} /></button></div>{notice && <div role="status" className={`notice ${notice.kind}`}>{notice.text}</div>}{txHash && <div className="tx-note"><code>{txHash}</code><span>Do not retry while this transaction is pending.</span></div>}</section></div>}
  </>
}

export default App
