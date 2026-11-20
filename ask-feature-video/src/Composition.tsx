import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from "remotion";

// ── Exact design tokens from ngscorecard.ng ───────────────────────────────────
const HEADER_BG = "#fffef9";
const HEADER_BORDER = "#b9cbc1";
const BODY_BG = "#f9f9f9";
const INK = "#132a1d";
const G800 = "#073f2a";
const G700 = "#006b45";
const ACCENT = "#0a6b45";
const MUTED = "#7f8c84";
const GRAY = "#666";
const FAINT = "#777";
const LINE = "#e0e0e0";
const LINE_STRONG = "#ddd";
const SURFACE = "#fff";
const COL = 760; // max content width

// ── Timeline ──────────────────────────────────────────────────────────────────
const T = {
  headerIn:   0,
  pageIn:    18,
  typeStart: 50,
  typeEnd:  220,
  sendAt:   250,
  spinnerIn: 265,
  answerIn:  355,
  sourcesIn: 460,
  endCard:   550,
  total:     620,
};

const QUESTION = "How do I register a business in Nigeria?";
const ANSWER = "To register a business in Nigeria, apply to the Corporate Affairs Commission (CAC). Start by reserving a business name on the CAC portal, then submit form CAC 2 (for a business name) or CAC 7 (for a company) along with the prescribed filing fee. For a private limited company you also need a Memorandum and Articles of Association. Once approved you receive a Certificate of Incorporation or RC Registration Certificate, usually within 1–5 working days online.";

// ── Helpers ───────────────────────────────────────────────────────────────────
function ease(frame: number, start: number, duration = 15, from = 0, to = 1) {
  return interpolate(frame, [start, start + duration], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
}

// ── NGScorecard crest SVG (exact from site) ───────────────────────────────────
function Crest({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      <rect width="64" height="64" rx="14" fill="#132a1d" />
      <path d="M17 16h7v32h-7zM40 16h7v32h-7z" fill="#f7f5ec" />
      <path d="M17 16h8l22 32h-8z" fill="#3fbf82" />
    </svg>
  );
}

// ── Header (exact replica of .pt-header) ─────────────────────────────────────
function Header({ frame }: { frame: number }) {
  const op = ease(frame, T.headerIn, 20);
  const ty = interpolate(frame, [T.headerIn, T.headerIn + 20], [-20, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const NAV = ["Recurring commitments", "Publications", "Guide", "Developers", "Press", "Ask"];

  return (
    <div style={{
      height: 90, flexShrink: 0,
      background: HEADER_BG,
      borderBottom: `1px solid ${HEADER_BORDER}`,
      display: "flex", alignItems: "center",
      padding: "0 40px", gap: 0,
      opacity: op, transform: `translateY(${ty}px)`,
    }}>
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginRight: "auto" }}>
        <Crest size={44} />
        <div>
          <div style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 11, fontWeight: 800,
            color: G700, letterSpacing: "0.08em",
            textTransform: "uppercase",
            lineHeight: 1.2,
          }}>
            Civic Accountability · Nigeria
          </div>
          <div style={{
            fontFamily: "Georgia, serif",
            fontSize: 22, fontWeight: 800,
            color: G800, lineHeight: 1.1,
            marginTop: 2,
          }}>
            NGScorecard
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
        {NAV.map((label) => (
          <div
            key={label}
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: 13.5,
              fontWeight: label === "Ask" ? 700 : 400,
              color: label === "Ask" ? G700 : MUTED,
              borderBottom: label === "Ask" ? `2px solid ${G700}` : "none",
              paddingBottom: label === "Ask" ? 2 : 0,
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Ask page header ───────────────────────────────────────────────────────────
function PageHeader({ frame }: { frame: number }) {
  const op = ease(frame, T.pageIn, 15);
  return (
    <div style={{
      background: SURFACE,
      borderBottom: `1px solid ${LINE}`,
      padding: "28px 40px",
      textAlign: "center",
      flexShrink: 0,
      opacity: op,
    }}>
      <h1 style={{
        margin: "0 0 8px",
        fontFamily: "system-ui, 'Segoe UI', sans-serif",
        fontSize: 26, fontWeight: 700,
        color: INK,
        lineHeight: 1.2,
      }}>
        Ask about government services
      </h1>
      <p style={{
        margin: "0 auto 6px",
        maxWidth: COL,
        fontFamily: "system-ui, sans-serif",
        fontSize: 15, color: GRAY,
        lineHeight: 1.5,
      }}>
        Answers come from the Government Service Portal and NHREC, with the sources shown.
      </p>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ frame }: { frame: number }) {
  if (frame >= T.typeStart - 5) return null;
  const op = ease(frame, T.pageIn + 5, 15);
  const HINTS = ["SME Registration (SMEDAN)", "NIN Pre-Enrolment (NIMC)", "Business Names (CAC)"];
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 10, opacity: op, padding: "0 40px",
    }}>
      <div style={{ fontSize: 32, lineHeight: 1 }}>💬</div>
      <p style={{
        margin: 0,
        fontFamily: "system-ui, sans-serif",
        fontSize: 15, fontWeight: 600,
        color: MUTED,
      }}>
        No questions yet. Try asking about:
      </p>
      {HINTS.map((h, i) => (
        <div key={h} style={{
          padding: "10px 18px",
          background: SURFACE,
          border: `1px solid ${LINE_STRONG}`,
          borderRadius: 6,
          fontFamily: "system-ui, sans-serif",
          fontSize: 14, color: INK,
          opacity: ease(frame, T.pageIn + 10 + i * 5, 12),
        }}>
          {h}
        </div>
      ))}
    </div>
  );
}

// ── User question bubble ──────────────────────────────────────────────────────
function QuestionBubble({ frame }: { frame: number }) {
  if (frame < T.typeStart - 5) return null;
  const opacity = ease(frame, T.typeStart - 5, 10);

  const charCount = Math.floor(
    interpolate(frame, [T.typeStart, T.typeEnd], [0, QUESTION.length], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })
  );
  const text = QUESTION.slice(0, charCount);
  const cursor = frame < T.sendAt && Math.floor(frame / 14) % 2 === 0;

  return (
    <div style={{
      alignSelf: "flex-end", maxWidth: "80%",
      opacity,
    }}>
      <div style={{
        background: ACCENT,
        color: "#fff",
        padding: "12px 16px",
        borderRadius: 6,
        fontFamily: "system-ui, sans-serif",
        fontSize: 15.2, lineHeight: 1.5,
      }}>
        {text}
        {cursor && (
          <span style={{
            display: "inline-block",
            width: 1.5,
            height: "1em",
            background: "rgba(255,255,255,0.75)",
            marginLeft: 2,
            verticalAlign: "text-bottom",
          }} />
        )}
      </div>
    </div>
  );
}

// ── Spinner / loading ─────────────────────────────────────────────────────────
function Spinner({ frame }: { frame: number }) {
  if (frame < T.spinnerIn || frame >= T.answerIn) return null;
  const op = ease(frame, T.spinnerIn, 10);
  const rot = ((frame - T.spinnerIn) * 6) % 360;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      opacity: op,
    }}>
      <svg width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="6" fill="none" stroke={LINE} strokeWidth="2.5" />
        <path d="M8 2 A6 6 0 0 1 14 8"
          fill="none" stroke={ACCENT} strokeWidth="2.5" strokeLinecap="round"
          transform={`rotate(${rot} 8 8)`}
        />
      </svg>
      <span style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14.4, color: GRAY,
      }}>
        Searching documents…
      </span>
    </div>
  );
}

// ── Answer card ───────────────────────────────────────────────────────────────
function AnswerCard({ frame }: { frame: number }) {
  if (frame < T.answerIn) return null;
  const op = ease(frame, T.answerIn, 18);
  const ty = interpolate(frame, [T.answerIn, T.answerIn + 18], [16, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const words = ANSWER.split(" ");
  const wc = Math.min(words.length, Math.floor(
    interpolate(frame, [T.answerIn + 5, T.answerIn + 85], [0, words.length], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp",
    })
  ));
  const text = words.slice(0, wc).join(" ");
  const typing = wc < words.length && Math.floor(frame / 10) % 2 === 0;

  const srcOp = ease(frame, T.sourcesIn, 18);
  const srcTy = interpolate(frame, [T.sourcesIn, T.sourcesIn + 18], [12, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 12,
      opacity: op, transform: `translateY(${ty}px)`,
    }}>
      {/* Answer text card */}
      <div style={{
        background: SURFACE,
        border: `1px solid #e6e6e6`,
        borderRadius: 6,
        padding: 16,
        fontFamily: "system-ui, sans-serif",
        fontSize: 15.2, lineHeight: "24.32px",
        color: "#333",
        minHeight: 60,
      }}>
        {text}
        {typing && (
          <span style={{
            display: "inline-block", width: 7, height: 14,
            background: ACCENT, marginLeft: 3,
            verticalAlign: "text-bottom",
            opacity: 0.8,
          }} />
        )}
      </div>

      {/* Sources */}
      {frame >= T.sourcesIn && (
        <div style={{
          display: "flex", flexDirection: "column", gap: 4,
          opacity: srcOp, transform: `translateY(${srcTy}px)`,
        }}>
          <div style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 13.6, fontWeight: 600,
            color: "#999", marginBottom: 4,
          }}>
            2 sources:
          </div>
          {[
            { num: "[1]", badge: "CAC", title: "Business Registration Process" },
            { num: "[2]", badge: "CAC", title: "CAC (Company Registration)", meta: "Government Service Portal, checked 18 Oct 2026" },
          ].map((src, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", flexWrap: "wrap",
              gap: "4px 12px", padding: "6px 6px", marginLeft: -6,
              fontFamily: "system-ui, sans-serif",
            }}>
              <span style={{ fontWeight: 700, fontSize: 12, color: G700 }}>{src.num}</span>
              <span style={{
                display: "inline-block",
                background: ACCENT, color: "#fff",
                padding: "4px 8px", borderRadius: 3,
                fontSize: 13.6, fontWeight: 600,
              }}>
                {src.badge}
              </span>
              <span style={{ fontSize: 13.6, color: ACCENT, fontWeight: 500 }}>
                {src.title}
              </span>
              {src.meta && (
                <span style={{ fontSize: 12, color: FAINT, marginLeft: "auto" }}>{src.meta}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sticky input bar ──────────────────────────────────────────────────────────
function InputBar({ frame }: { frame: number }) {
  if (frame < T.pageIn) return null;
  const op = ease(frame, T.pageIn, 15);

  const hasText = frame >= T.typeStart && frame < T.sendAt;
  const isLoading = frame >= T.spinnerIn && frame < T.answerIn;
  const isDone = frame >= T.answerIn;

  const charCount = hasText
    ? Math.floor(interpolate(frame, [T.typeStart, T.typeEnd], [0, QUESTION.length], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
      }))
    : 0;

  const btnPulse = frame >= T.sendAt && frame < T.sendAt + 12
    ? interpolate(frame, [T.sendAt, T.sendAt + 12], [1, 0.9], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
      })
    : 1;

  const btnActive = hasText && charCount === QUESTION.length;
  const placeholder = isDone
    ? "Ask a follow-up, or a new question…"
    : "Ask a question about a government service…";

  return (
    <div style={{
      background: SURFACE,
      borderTop: `1px solid ${LINE_STRONG}`,
      padding: 16,
      display: "flex", gap: 12, alignItems: "flex-end",
      flexShrink: 0, opacity: op,
    }}>
      <div style={{
        flex: 1, minHeight: 50,
        border: `1px solid ${hasText ? ACCENT : LINE_STRONG}`,
        borderRadius: 6,
        padding: 12,
        fontFamily: "system-ui, sans-serif",
        fontSize: 14.4,
        color: charCount > 0 ? INK : MUTED,
        background: SURFACE,
        display: "flex", alignItems: "center",
        lineHeight: 1.4,
      }}>
        {charCount > 0 ? QUESTION.slice(0, charCount) : placeholder}
      </div>
      <div style={{
        height: 50, padding: "0 24px",
        background: btnActive || isLoading || isDone ? ACCENT : "#c8d5cf",
        color: "#fff",
        borderRadius: 6,
        fontFamily: "system-ui, sans-serif",
        fontWeight: 600, fontSize: 14.4,
        display: "flex", alignItems: "center",
        transform: `scale(${btnPulse})`,
        whiteSpace: "nowrap",
      }}>
        {isLoading ? "Searching…" : "Ask"}
      </div>
    </div>
  );
}

// ── End card ──────────────────────────────────────────────────────────────────
function EndCard({ frame }: { frame: number }) {
  if (frame < T.endCard) return null;
  const op = ease(frame, T.endCard, 22);
  return (
    <AbsoluteFill style={{
      background: G800, opacity: op,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Crest size={64} />
        <div>
          <div style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 13, fontWeight: 800, letterSpacing: "0.08em",
            color: "rgba(255,255,255,0.6)", textTransform: "uppercase",
            marginBottom: 4,
          }}>
            Civic Accountability · Nigeria
          </div>
          <div style={{
            fontFamily: "Georgia, serif",
            fontSize: 46, fontWeight: 800,
            color: "#fff", lineHeight: 1.1,
          }}>
            NGScorecard
          </div>
        </div>
      </div>
      <div style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 22, color: "rgba(255,255,255,0.8)",
        fontWeight: 400,
      }}>
        Ask. Get answers. See the sources.
      </div>
      <div style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 15, color: "rgba(255,255,255,0.4)",
        marginTop: 4,
      }}>
        ngscorecard.ng/ask
      </div>
    </AbsoluteFill>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export const AskDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const isEnd = frame >= T.endCard;
  const W = 1280;
  const pad = Math.max(40, (W - COL) / 2);

  return (
    <AbsoluteFill style={{ background: BODY_BG, fontFamily: "system-ui, sans-serif" }}>
      {!isEnd && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          <Header frame={frame} />
          <PageHeader frame={frame} />

          {/* Chat area */}
          <div style={{
            flex: 1,
            padding: `24px ${pad}px 0`,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            overflowY: "hidden",
          }}>
            <EmptyState frame={frame} />
            <QuestionBubble frame={frame} />
            <Spinner frame={frame} />
            <AnswerCard frame={frame} />
          </div>

          <InputBar frame={frame} />
        </div>
      )}
      <EndCard frame={frame} />
    </AbsoluteFill>
  );
};
