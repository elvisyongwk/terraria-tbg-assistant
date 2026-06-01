import React, { createContext, useContext, useState, useCallback } from "react";

type Toast = {
  id: string;
  message: string;
  type?: "info" | "damage" | "roll" | "state" | "success" | "error";
};

const ToastContext = createContext<{
  show: (message: string, type?: Toast["type"]) => string;
  dismiss: (id: string) => void;
  clearAll: () => void;
} | null>(null);

function getToastColor(type?: Toast["type"]): string {
  switch (type) {
    case "damage":
      return "#9b1c1c"; // dark red
    case "roll":
      return "#1e40af"; // dark blue
    case "state":
      return "#374151"; // dark gray
    default:
      return "#333"; // black
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, message, type }]);
    return id;
  }, []);

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
          top: 12,
          right: 12,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 12,
        }}
      >
        {toasts.length > 0 && (
          <button
            onClick={clearAll}
            aria-label="Clear all toasts"
            style={{
              padding: "6px 12px",
              background: "#666",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Clear All
          </button>
        )}
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "12px 16px",
              background: getToastColor(t.type),
              color: "white",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              minWidth: 240,
              maxWidth: 400,
            }}
          >
            <div style={{ flex: 1, fontSize: 14 }}>{t.message}</div>
            <button
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss toast"
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                cursor: "pointer",
                fontSize: 18,
                lineHeight: 1,
                padding: "4px 8px",
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        ))}
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
