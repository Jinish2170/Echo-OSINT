import { useEffect, useState } from "react";
import "./App.css";

interface Target {
  id: string;
  value: string;
  type: "username" | "domain" | "email" | "ip";
  discoveredAt: string;
}

interface EvidenceLink {
  id: string;
  source: string;
  sourceType: "api" | "web" | "user" | "derived";
  data: string;
  reliability: number;
  collectedAt: string;
  verified: boolean;
}

interface Belief {
  id: string;
  targetId: string;
  claim: string;
  status: "established" | "likely" | "uncertain";
  confidence: number;
  evidence: EvidenceLink[];
  createdAt: string;
  updatedAt: string;
}

interface Finding {
  id: string;
  target: Target;
  type: "entity" | "relationship" | "credential" | "breach" | "infrastructure";
  value: string;
  source: string;
  sourceUrl?: string;
  significance: { novelty: number; rarity: number; severity: number; timeliness: number; total: number };
  evidence: EvidenceLink[];
  collectedAt: string;
}

interface Lead {
  id: string;
  description: string;
  priority: "high" | "medium" | "low";
  rationale: string;
  estimatedEffort: string;
}

interface ReconResult {
  success: boolean;
  target: Target;
  findings: Finding[];
  beliefs: Belief[];
  contradictions: Array<{ beliefIdA: string; beliefIdB: string; claimA: string; claimB: string; severity: string }>;
  brief: {
    target: Target;
    mode: string;
    startedAt: string;
    completedAt: string;
    establishedFacts: Belief[];
    likelyAssessments: Belief[];
    leads: Lead[];
    negativeFindings: string[];
    summary: string;
  };
  stats: {
    totalFindings: number;
    establishedFacts: number;
    likelyAssessments: number;
    leads: number;
    negativeFindings: number;
  };
}

interface InvestigationSummary {
  id: string;
  target: { value: string; type: string };
  mode: string;
  createdAt: string;
  stats: ReconResult["stats"];
}

type Mode = "hunter" | "investigator" | "watcher";
type Depth = "quick" | "normal" | "deep";
type Tab = "findings" | "beliefs" | "leads" | "history";

const MODES: { value: Mode; label: string }[] = [
  { value: "hunter", label: "Hunter" },
  { value: "investigator", label: "Investigator" },
  { value: "watcher", label: "Watcher" },
];

const DEPTHS: { value: Depth; label: string }[] = [
  { value: "quick", label: "Quick" },
  { value: "normal", label: "Normal" },
  { value: "deep", label: "Deep" },
];

function App() {
  const [target, setTarget] = useState("");
  const [mode, setMode] = useState<Mode>("investigator");
  const [depth, setDepth] = useState<Depth>("normal");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReconResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("findings");
  const [history, setHistory] = useState<InvestigationSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/investigations?limit=50");
      if (!res.ok) throw new Error("Failed to load history");
      const json = await res.json();
      setHistory(json.investigations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") fetchHistory();
  }, [activeTab]);

  const loadInvestigation = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/investigation/${encodeURIComponent(id)}`);
      if (!res.ok) throw new Error("Investigation not found");
      const rec = await res.json();
      setResult({
        success: true,
        target: rec.target,
        findings: rec.findings,
        beliefs: rec.beliefs,
        contradictions: rec.contradictions || [],
        brief: rec.brief,
        stats: rec.stats,
      });
      setActiveTab("findings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const runRecon = async () => {
    if (!target.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/recon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, mode, depth }),
      });
      if (!res.ok) throw new Error("Server error: " + res.status);
      setResult(await res.json());
      setActiveTab("findings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reconnaissance failed");
    } finally {
      setLoading(false);
    }
  };

  const exportJSON = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `echo-osint-${result.target.value}-${result.target.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPriorityColor = (p: string) => p === "high" ? "#ef4444" : p === "medium" ? "#f59e0b" : "#22c55e";
  const getStatusColor = (s: string) => s === "established" ? "#22c55e" : s === "likely" ? "#f59e0b" : "#6366f1";

  return (
    <div className="app">
      <header className="header">
        <div className="logo"><span className="logo-icon">E</span><h1>Echo-OSINT</h1></div>
        <p className="tagline">Autonomous Intelligence Engine — Target reconnaissance with belief-based reasoning</p>
      </header>
      <main className="main">
        <div className="controls">
          <div className="input-group">
            <label>Target</label>
            <input type="text" value={target} onChange={e => setTarget(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !loading && runRecon()}
              placeholder="username, domain, email, or IP" className="mono" />
          </div>
          <div className="select-group">
            <label>Mode</label>
            <select value={mode} onChange={e => setMode(e.target.value as Mode)}>
              {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="select-group">
            <label>Depth</label>
            <select value={depth} onChange={e => setDepth(e.target.value as Depth)}>
              {DEPTHS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <button onClick={runRecon} disabled={loading || !target.trim()} className="scan-btn">
            {loading ? "Scanning..." : "Scan"}
          </button>
        </div>

        <div className="tabs" style={{ marginTop: "1.5rem" }}>
          <button className={activeTab === "findings" ? "active" : ""} onClick={() => setActiveTab("findings")}>
            Findings{result ? ` (${result.findings.length})` : ""}
          </button>
          <button className={activeTab === "beliefs" ? "active" : ""} onClick={() => setActiveTab("beliefs")}>
            Beliefs{result ? ` (${result.brief.establishedFacts.length + result.brief.likelyAssessments.length})` : ""}
          </button>
          <button className={activeTab === "leads" ? "active" : ""} onClick={() => setActiveTab("leads")}>
            Leads{result ? ` (${result.brief.leads.length})` : ""}
          </button>
          <button className={activeTab === "history" ? "active" : ""} onClick={() => setActiveTab("history")}>
            History
          </button>
          {result && (
            <button onClick={exportJSON} className="export-btn" style={{ marginLeft: "auto" }}>
              ⬇ Export JSON
            </button>
          )}
        </div>

        {error && <div className="error">{error}</div>}

        {loading && !result && (
          <div className="tab-content">
            <p style={{ color: "var(--text-secondary)" }}>Scanning {target}... this can take up to 30s for username recon across 50+ platforms.</p>
          </div>
        )}

        {result && activeTab !== "history" && (
          <>
            <div className="stats-bar" style={{ marginTop: "1rem" }}>
              <div className="stat"><span className="stat-value">{result.stats.totalFindings}</span><span className="stat-label">Findings</span></div>
              <div className="stat"><span className="stat-value established">{result.stats.establishedFacts}</span><span className="stat-label">Established</span></div>
              <div className="stat"><span className="stat-value likely">{result.stats.likelyAssessments}</span><span className="stat-label">Likely</span></div>
              <div className="stat"><span className="stat-value leads">{result.stats.leads}</span><span className="stat-label">Leads</span></div>
            </div>
            <div className="brief-box"><p>{result.brief.summary}</p></div>
            <div className="tab-content">
              {activeTab === "findings" && (
                <div className="findings-table">
                  {result.findings.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)" }}>No findings.</p>
                  ) : (
                    <table><thead><tr><th>Source</th><th>Type</th><th>Value</th><th>Sig</th></tr></thead>
                      <tbody>{result.findings.map(f => (
                        <tr key={f.id}>
                          <td><span className="source-badge">{f.source}</span></td>
                          <td><span className={"type-badge " + f.type}>{f.type}</span></td>
                          <td className="mono">
                            {f.sourceUrl ? (
                              <a href={f.sourceUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent)" }}>{f.value}</a>
                            ) : f.value}
                          </td>
                          <td><span className={"sig-badge sig-" + (f.significance.total > 0.7 ? "high" : f.significance.total > 0.4 ? "med" : "low")}>{f.significance.total.toFixed(2)}</span></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  )}
                </div>
              )}
              {activeTab === "beliefs" && (
                <div className="beliefs-list">
                  {result.brief.establishedFacts.length + result.brief.likelyAssessments.length === 0 && (
                    <p style={{ color: "var(--text-secondary)" }}>No established or likely beliefs yet.</p>
                  )}
                  {result.brief.establishedFacts.map(b => (
                    <div key={b.id} className="belief established">
                      <div className="belief-header">
                        <span className="status-dot" style={{background: getStatusColor("established")}} />
                        <span className="belief-status">ESTABLISHED</span>
                        <span className="confidence">{b.confidence.toFixed(2)}</span>
                      </div>
                      <p className="belief-claim">{b.claim}</p>
                      <p className="belief-source">{b.evidence[0]?.source || "unknown"}</p>
                    </div>
                  ))}
                  {result.brief.likelyAssessments.map(b => (
                    <div key={b.id} className="belief likely">
                      <div className="belief-header">
                        <span className="status-dot" style={{background: getStatusColor("likely")}} />
                        <span className="belief-status">LIKELY</span>
                        <span className="confidence">{b.confidence.toFixed(2)}</span>
                      </div>
                      <p className="belief-claim">{b.claim}</p>
                      <p className="belief-source">{b.evidence[0]?.source || "unknown"}</p>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === "leads" && (
                <div className="leads-list">
                  {result.brief.leads.length === 0 && (
                    <p style={{ color: "var(--text-secondary)" }}>No leads generated.</p>
                  )}
                  {result.brief.leads.map(l => (
                    <div key={l.id} className="lead-item">
                      <div className="lead-header">
                        <span className="lead-priority" style={{background: getPriorityColor(l.priority)}}>{l.priority.toUpperCase()}</span>
                        <span className="lead-effort">{l.estimatedEffort}</span>
                      </div>
                      <p className="lead-desc">{l.description}</p>
                      <p className="lead-rationale">{l.rationale}</p>
                    </div>
                  ))}
                  {result.brief.negativeFindings.length > 0 && (
                    <div className="negatives"><h4>Negative Findings</h4><ul>{result.brief.negativeFindings.map((n, i) => <li key={i}>{n}</li>)}</ul></div>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "history" && (
          <div className="tab-content" style={{ marginTop: "1rem" }}>
            {historyLoading && <p style={{ color: "var(--text-secondary)" }}>Loading...</p>}
            {!historyLoading && history.length === 0 && (
              <p style={{ color: "var(--text-secondary)" }}>No past investigations yet. Run a scan to start building history.</p>
            )}
            {!historyLoading && history.length > 0 && (
              <table>
                <thead><tr><th>Target</th><th>Type</th><th>Mode</th><th>Findings</th><th>Leads</th><th>When</th><th></th></tr></thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id}>
                      <td className="mono">{h.target.value}</td>
                      <td><span className="source-badge">{h.target.type}</span></td>
                      <td>{h.mode}</td>
                      <td>{h.stats.totalFindings}</td>
                      <td>{h.stats.leads}</td>
                      <td style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>{new Date(h.createdAt).toLocaleString()}</td>
                      <td><button className="link-btn" onClick={() => loadInvestigation(h.id)}>Open</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
