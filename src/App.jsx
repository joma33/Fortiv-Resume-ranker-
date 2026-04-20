import { useState } from "react";
import {
  Briefcase,
  MessageSquare,
  BarChart3,
  Plus,
  X,
  Copy,
  Check,
  Loader2,
  Mail,
  Linkedin,
  Sparkles,
} from "lucide-react";

const NAVY = "#1B3A6B";
const ACCENT = "#2E75B6";
const LIGHT_BLUE = "#A8C4E0";
const PALE_BLUE = "#D6E4F0";
const BG = "#F5F7FA";

async function callClaude(prompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) throw new Error("Request failed");
  const data = await response.json();
  return data.content.map((b) => b.text || "").join("");
}

function FormattedOutput({ text }) {
  if (!text) return null;
  const sections = text.split(/\n\s*---+\s*\n/);
  return (
    <div>
      {sections.map((section, sIdx) => (
        <div key={sIdx}>
          {sIdx > 0 && (
            <div
              className="my-6 border-t"
              style={{ borderColor: PALE_BLUE }}
            />
          )}
          <FormattedSection text={section} />
        </div>
      ))}
    </div>
  );
}

function FormattedSection({ text }) {
  const paragraphs = text.split(/\n\n+/);
  return (
    <>
      {paragraphs.map((p, idx) => {
        const parts = p.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p
            key={idx}
            className="mb-4 leading-relaxed whitespace-pre-wrap"
            style={{ color: "#1F2937", fontSize: "15px" }}
          >
            {parts.map((part, i) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                return (
                  <strong key={i} style={{ color: NAVY }}>
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return <span key={i}>{part}</span>;
            })}
          </p>
        );
      })}
    </>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
  return (
    <button
      onClick={onCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
      style={{
        backgroundColor: copied ? "#10B981" : PALE_BLUE,
        color: copied ? "white" : NAVY,
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function PrimaryButton({ onClick, loading, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-md font-medium text-white transition-opacity"
      style={{
        backgroundColor: NAVY,
        opacity: loading || disabled ? 0.5 : 1,
        cursor: loading || disabled ? "not-allowed" : "pointer",
      }}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Sparkles size={16} />
      )}
      {children}
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <label
      className="block text-xs font-semibold uppercase tracking-wider mb-2"
      style={{ color: NAVY }}
    >
      {children}
    </label>
  );
}

function JDTextarea({ value, onChange, placeholder }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || "Paste the job description here..."}
      className="w-full px-3 py-2.5 rounded-md border text-sm resize-y focus:outline-none"
      style={{
        borderColor: "#D1D5DB",
        minHeight: "180px",
        fontFamily: "inherit",
      }}
    />
  );
}

function ResultCard({ title, children, copyText }) {
  return (
    <div
      className="mt-6 rounded-lg overflow-hidden border"
      style={{ borderColor: PALE_BLUE, backgroundColor: "white" }}
    >
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: PALE_BLUE }}
      >
        <h3 className="font-semibold text-sm" style={{ color: NAVY }}>
          {title}
        </h3>
        {copyText && <CopyButton text={copyText} />}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function QuestionsTab() {
  const [jd, setJd] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    if (!jd.trim()) return;
    setLoading(true);
    setResult("");
    setError("");
    try {
      const prompt = `Generate exactly 5 technical interview questions for the job description below.

Format rules (follow exactly):
- Each question formatted as bold numbered line: **1. [Question text]?**
- Immediately followed by a paragraph starting with "Listen for:" that explains what a strong answer sounds like
- Questions must be specific to the tech stack and requirements in the JD
- Range from foundational to advanced across the 5 questions
- All open ended, never yes/no
- No headers, no intro, no outro, no summary
- Just the 5 questions in sequence, separated by blank lines
- CRITICAL: Never use dashes (— or -) anywhere. Use commas, semicolons, or restructure sentences instead. This includes in "Listen for" paragraphs.

Job Description:
${jd}`;
      const text = await callClaude(prompt);
      setResult(text);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm" style={{ color: "#4B5563" }}>
          Paste a JD and get 5 technical screening questions with "Listen for"
          guidance, specific to the stack.
        </p>
      </div>

      <SectionLabel>Job Description</SectionLabel>
      <JDTextarea value={jd} onChange={setJd} />

      <div className="mt-4 flex items-center gap-3">
        <PrimaryButton onClick={generate} loading={loading} disabled={!jd.trim()}>
          {loading ? "Generating" : "Generate Questions"}
        </PrimaryButton>
        {error && (
          <span className="text-sm" style={{ color: "#DC2626" }}>
            {error}
          </span>
        )}
      </div>

      {result && (
        <ResultCard title="Screening Questions" copyText={result}>
          <FormattedOutput text={result} />
        </ResultCard>
      )}
    </div>
  );
}

function OutreachTab() {
  const [jd, setJd] = useState("");
  const [channel, setChannel] = useState("linkedin");
  const [candidateName, setCandidateName] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    if (!jd.trim()) return;
    setLoading(true);
    setResult("");
    setError("");
    try {
      const channelLabel =
        channel === "linkedin" ? "LinkedIn InMail / connection message" : "email";
      const lengthGuide =
        channel === "linkedin"
          ? "Keep each variant short, under 120 words. LinkedIn is skimmed quickly."
          : "Email can run slightly longer, 120 to 180 words. Include a clear subject line on a separate first line formatted as: Subject: [subject].";

      const nameLine = candidateName.trim()
        ? `Candidate first name: ${candidateName.trim()}\n`
        : "Candidate first name: [Name] (use [Name] as placeholder)\n";

      const prompt = `Write two variants of a ${channelLabel} to reach out to a passive candidate about the role below. These are for Fortiv, a boutique technology staffing firm.

Voice and style rules (critical):
- Concise, warm, natural, relationship driven
- Never corporate, never salesy, never hype
- Sound like a human talking to a human
- No jargon like "synergy", "leverage", "reach out", "touch base"
- ${lengthGuide}
- Reference 1 or 2 specific things from the JD that would matter to a strong candidate
- End with a soft, low friction call to action (short chat, brief intro call, etc.)
- CRITICAL: Never use dashes (— or -) anywhere in the messages. Use commas, periods, or restructure. This is a strict rule.

Format your output exactly like this (nothing else, no preamble):

**Option 1: [short label describing the angle, e.g. "Direct and specific"]**

[Message body]

---

**Option 2: [short label describing a different angle, e.g. "Curious and low pressure"]**

[Message body]

${nameLine}Job Description:
${jd}`;
      const text = await callClaude(prompt);
      setResult(text);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm" style={{ color: "#4B5563" }}>
          Generate two outreach variants for a candidate. Concise, warm,
          non-salesy.
        </p>
      </div>

      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setChannel("linkedin")}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          style={{
            backgroundColor: channel === "linkedin" ? NAVY : "white",
            color: channel === "linkedin" ? "white" : NAVY,
            border: `1px solid ${NAVY}`,
          }}
        >
          <Linkedin size={16} />
          LinkedIn
        </button>
        <button
          onClick={() => setChannel("email")}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          style={{
            backgroundColor: channel === "email" ? NAVY : "white",
            color: channel === "email" ? "white" : NAVY,
            border: `1px solid ${NAVY}`,
          }}
        >
          <Mail size={16} />
          Email
        </button>
      </div>

      <div className="mb-4">
        <SectionLabel>Candidate First Name (optional)</SectionLabel>
        <input
          type="text"
          value={candidateName}
          onChange={(e) => setCandidateName(e.target.value)}
          placeholder="e.g. Sarah"
          className="w-full px-3 py-2.5 rounded-md border text-sm focus:outline-none"
          style={{ borderColor: "#D1D5DB" }}
        />
      </div>

      <SectionLabel>Job Description</SectionLabel>
      <JDTextarea value={jd} onChange={setJd} />

      <div className="mt-4 flex items-center gap-3">
        <PrimaryButton onClick={generate} loading={loading} disabled={!jd.trim()}>
          {loading ? "Generating" : "Generate Message"}
        </PrimaryButton>
        {error && (
          <span className="text-sm" style={{ color: "#DC2626" }}>
            {error}
          </span>
        )}
      </div>

      {result && (
        <ResultCard
          title={channel === "linkedin" ? "LinkedIn Message Options" : "Email Options"}
          copyText={result}
        >
          <FormattedOutput text={result} />
        </ResultCard>
      )}
    </div>
  );
}

function RankerTab() {
  const [jd, setJd] = useState("");
  const [resumes, setResumes] = useState([{ id: 1, name: "", text: "" }]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addResume = () => {
    setResumes([
      ...resumes,
      { id: Date.now() + Math.random(), name: "", text: "" },
    ]);
  };

  const removeResume = (id) => {
    setResumes(resumes.filter((r) => r.id !== id));
  };

  const updateResume = (id, field, value) => {
    setResumes(
      resumes.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const validResumes = resumes.filter((r) => r.text.trim());
  const canGenerate = jd.trim() && validResumes.length >= 1;

  const generate = async () => {
    if (!canGenerate) return;
    setLoading(true);
    setResult("");
    setError("");
    try {
      const resumeBlocks = validResumes
        .map((r, idx) => {
          const label = r.name.trim() || `Candidate ${idx + 1}`;
          return `### ${label}\n${r.text.trim()}`;
        })
        .join("\n\n---\n\n");

      const prompt = `Rank the candidates below against the job description.

Format rules (follow exactly, no deviation):
- Order highest to lowest score
- For each candidate, output in this exact structure:

**Rank [N]. [Candidate Name] | Score: [XX]/100**

[Two sentence summary of why they ranked here]

**Strengths**
[Paragraph describing specific strengths relevant to the JD]

**Gaps**
[Paragraph describing specific gaps or concerns relevant to the JD]

**Recommendation:** [Present to client / Hold / Pass]

- Separate each candidate with a line containing only "---" (three dashes on its own line)
- No tables
- No intro, no summary at the end
- Be specific to the JD tech stack and requirements
- Base scores on actual fit, not on effort or politeness
- CRITICAL: Never use dashes (— or -) inside prose, sentences, or labels. The only dashes in your output should be the "---" separator lines between candidates. Use commas, periods, or restructure sentences instead.

Job Description:
${jd}

Candidates:
${resumeBlocks}`;
      const text = await callClaude(prompt);
      setResult(text);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm" style={{ color: "#4B5563" }}>
          Paste a JD and any number of resumes. Get a scored ranking with
          strengths, gaps, and a recommendation for each.
        </p>
      </div>

      <SectionLabel>Job Description</SectionLabel>
      <JDTextarea value={jd} onChange={setJd} />

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>
            Candidates ({validResumes.length} with content)
          </SectionLabel>
        </div>

        <div className="space-y-4">
          {resumes.map((r, idx) => (
            <div
              key={r.id}
              className="rounded-md border p-4"
              style={{ borderColor: PALE_BLUE, backgroundColor: "white" }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: NAVY }}
                >
                  Candidate {idx + 1}
                </span>
                {resumes.length > 1 && (
                  <button
                    onClick={() => removeResume(r.id)}
                    className="p-1 rounded hover:bg-gray-100"
                    style={{ color: "#6B7280" }}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <input
                type="text"
                value={r.name}
                onChange={(e) => updateResume(r.id, "name", e.target.value)}
                placeholder="Candidate name (optional)"
                className="w-full px-3 py-2 rounded-md border text-sm focus:outline-none mb-2"
                style={{ borderColor: "#D1D5DB" }}
              />
              <textarea
                value={r.text}
                onChange={(e) => updateResume(r.id, "text", e.target.value)}
                placeholder="Paste resume text here..."
                className="w-full px-3 py-2 rounded-md border text-sm resize-y focus:outline-none"
                style={{
                  borderColor: "#D1D5DB",
                  minHeight: "120px",
                  fontFamily: "inherit",
                }}
              />
            </div>
          ))}
        </div>

        <button
          onClick={addResume}
          className="mt-3 flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          style={{
            backgroundColor: "white",
            color: NAVY,
            border: `1px dashed ${NAVY}`,
          }}
        >
          <Plus size={16} />
          Add Another Candidate
        </button>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <PrimaryButton
          onClick={generate}
          loading={loading}
          disabled={!canGenerate}
        >
          {loading ? "Ranking" : "Rank Candidates"}
        </PrimaryButton>
        {error && (
          <span className="text-sm" style={{ color: "#DC2626" }}>
            {error}
          </span>
        )}
      </div>

      {result && (
        <ResultCard title="Ranked Candidates" copyText={result}>
          <FormattedOutput text={result} />
        </ResultCard>
      )}
    </div>
  );
}

export default function FortivRecruiterToolkit() {
  const [activeTab, setActiveTab] = useState("questions");

  const tabs = [
    { id: "questions", label: "Screening Questions", icon: Briefcase },
    { id: "outreach", label: "Candidate Outreach", icon: MessageSquare },
    { id: "ranker", label: "Resume Ranker", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: BG }}>
      <header
        style={{ backgroundColor: NAVY }}
        className="px-6 py-5 shadow-md"
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-3">
              <h1 className="text-white text-2xl font-bold tracking-tight">
                FORTIV
              </h1>
              <span style={{ color: LIGHT_BLUE }} className="text-sm">
                Recruiter Toolkit
              </span>
            </div>
          </div>
          <div
            style={{ color: LIGHT_BLUE }}
            className="text-xs text-right hidden sm:block"
          >
            Cyber Security | AI | Data | App Dev
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div
          className="flex gap-1 mb-6 border-b overflow-x-auto"
          style={{ borderColor: "#E5E7EB" }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors"
                style={{
                  color: isActive ? NAVY : "#6B7280",
                  borderBottom: isActive
                    ? `3px solid ${NAVY}`
                    : "3px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          className="rounded-lg p-6"
          style={{ backgroundColor: "white", border: `1px solid ${PALE_BLUE}` }}
        >
          {activeTab === "questions" && <QuestionsTab />}
          {activeTab === "outreach" && <OutreachTab />}
          {activeTab === "ranker" && <RankerTab />}
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            Confidential | Prepared by Fortiv | fortiv.ca
          </p>
        </div>
      </div>
    </div>
  );
}
