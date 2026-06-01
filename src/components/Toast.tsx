import React, { createContext, useContext, useState, useCallback } from "react";

type Toast = {
  id: string;
  message: string;
  type?: "info" | "damage" | "roll" | "state" | "success" | "error";
  source?: "player" | "enemy" | "system";
  actionable?: boolean;
};

const ToastContext = createContext<{
  show: (
    message: string,
    type?: Toast["type"],
    source?: Toast["source"],
    actionable?: boolean
  ) => string;
  dismiss: (id: string) => void;
  clearAll: () => void;
} | null>(null);

function getToastBackground(
  type?: Toast["type"],
  source?: Toast["source"]
): string {
  // Player actions use blue/teal tones
  if (source === "player") {
    switch (type) {
      case "damage":
        return "linear-gradient(135deg, #1e40af, #2d60d1)";
      case "roll":
        return "linear-gradient(135deg, #0369a1, #0284c7)";
      case "state":
        return "linear-gradient(135deg, #0f766e, #14b8a6)";
      case "success":
        return "linear-gradient(135deg, #2ee59d, #1b9b74)";
      default:
        return "linear-gradient(135deg, #06b6d4, #0891b2)";
    }
  }

  // Enemy actions use red/orange tones
  if (source === "enemy") {
    switch (type) {
      case "damage":
        return "linear-gradient(135deg, #b92a2a, #7a1414)";
      case "roll":
        return "linear-gradient(135deg, #c2410c, #ea580c)";
      case "state":
        return "linear-gradient(135deg, #dc2626, #991b1b)";
      case "error":
        return "linear-gradient(135deg, #ff4d6d, #c5304d)";
      default:
        return "linear-gradient(135deg, #d97706, #92400e)";
    }
  }

  // System defaults
  switch (type) {
    case "damage":
      return "linear-gradient(135deg, #b92a2a, #7a1414)";
    case "roll":
      return "linear-gradient(135deg, #1e40af, #2d60d1)";
    case "state":
      return "linear-gradient(135deg, #334155, #1f2937)";
    case "success":
      return "linear-gradient(135deg, #2ee59d, #1b9b74)";
    case "error":
      return "linear-gradient(135deg, #ff4d6d, #c5304d)";
    default:
      return "linear-gradient(135deg, #244c37, #1f3e4f)";
  }
}

function getToastIcon(type?: Toast["type"]): string {
  switch (type) {
    case "damage":
      return "⚔️";
    case "roll":
      return "🎲";
    case "state":
      return "📋";
    case "success":
      return "✨";
    case "error":
      return "⚠️";
    default:
      return "ℹ️";
  }
}

function isActionableMessage(message: string, type?: Toast["type"], source?: Toast["source"]): boolean {
  const lower = message.toLowerCase();
  // Player takes damage - actionable
  if (lower.includes("player takes") || lower.includes("player damaged")) return true;
  // Rewards - actionable
  if (lower.includes("reward") || lower.includes("received")) return true;
  // Enemy dies - actionable
  if (lower.includes("defeated") || lower.includes("defeated")) return true;
  // Damage dealt - actionable for player source
  if (source === "player" && type === "damage") return true;
  // Player blocks (defensive success) - actionable
  if (lower.includes("block")) return true;
  return false;
}

function getToastSourceLabel(source?: Toast["source"]): { text: string; color: string } {
  switch (source) {
    case "player":
      return { text: "Player", color: "#77ffbc" };
    case "enemy":
      return { text: "Enemy", color: "#ff8b8b" };
    default:
      return { text: "System", color: "#94d6ff" };
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback(
    (
      message: string,
      type: Toast["type"] = "info",
      source: Toast["source"] = "system",
      actionable?: boolean
    ) => {
      const id = crypto.randomUUID();
      const isActionable =
        actionable !== undefined
          ? actionable
          : isActionableMessage(message, type, source);
      setToasts((t) => [...t, { id, message, type, source, actionable: isActionable }]);
      return id;
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ show, dismiss, clearAll }}>
      {children}
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 14,
          maxWidth: 420,
          padding: 6,
          pointerEvents: "none",
        }}
      >
        {toasts.length > 0 && (
          <button
            onClick={clearAll}
            aria-label="Clear all toasts"
            style={{
              pointerEvents: "auto",
              padding: "8px 14px",
              background: "rgba(17, 45, 33, 0.92)",
              color: "#d7f7e7",
              border: "1px solid rgba(94, 237, 165, 0.35)",
              borderRadius: 14,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              boxShadow: "0 10px 24px rgba(0, 0, 0, 0.18)",
            }}
          >
            Clear All Messages
          </button>
        )}
        {toasts.map((t) => {
          const sourceBadge = getToastSourceLabel(t.source);
          const icon = getToastIcon(t.type);

          return (
            <div
              key={t.id}
              role="status"
              aria-live="polite"
              style={{
                pointerEvents: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "14px 16px",
                background: getToastBackground(t.type, t.source),
                color: "white",
                borderRadius: 18,
                border: t.actionable
                  ? "2px solid rgba(255, 255, 255, 0.35)"
                  : "1px solid rgba(255, 255, 255, 0.08)",
                boxShadow: t.actionable
                  ? "0 16px 35px rgba(0,0,0,0.28), 0 0 20px rgba(255,255,255,0.12)"
                  : "0 16px 35px rgba(0,0,0,0.28)",
                minWidth: 260,
                maxWidth: 420,
                overflow: "hidden",
                backdropFilter: "blur(12px)",
              }}
            >
              {t.actionable && (
                <span
                  style={{
                    display: "inline-block",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#fbbf24",
                    flexShrink: 0,
                    animation: "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  }}
                />
              )}
              <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1 }}>
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "4px 10px",
                    borderRadius: 9999,
                    background: "rgba(255,255,255,0.12)",
                    border: `1px solid ${sourceBadge.color}`,
                    color: sourceBadge.color,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    textTransform: "uppercase",
                  }}
                >
                  {sourceBadge.text}
                </span>
                <div style={{ flex: 1, fontSize: 13.5, lineHeight: 1.5 }}>
                  {t.message}
                </div>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss toast"
                style={{
                  background: "rgba(255, 255, 255, 0.12)",
                  border: "1px solid rgba(255, 255, 255, 0.18)",
                  color: "white",
                  cursor: "pointer",
                  fontSize: 16,
                  lineHeight: 1,
                  padding: "6px 10px",
                  borderRadius: 12,
                  flexShrink: 0,
                  minWidth: 32,
                  minHeight: 32,
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export default ToastProvider;
