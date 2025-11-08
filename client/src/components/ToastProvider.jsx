import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const removeTimers = useRef({});

  const removeToast = useCallback((id) => {
    // mark invisible to trigger exit transition
    setToasts((prev) =>
      prev.map((x) => (x.id === id ? { ...x, visible: false } : x))
    );
    // actually remove after transition time
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
      if (removeTimers.current[id]) {
        clearTimeout(removeTimers.current[id]);
        delete removeTimers.current[id];
      }
    }, 320);
  }, []);

  const addToast = useCallback(
    (message, type = "info", ms = 4000) => {
      const id = `${Date.now()}-${++idCounter}`;
      const t = { id, message, type, visible: false };
      setToasts((prev) => [...prev, t]);

      // show after a frame so CSS transition can run
      requestAnimationFrame(() => {
        setToasts((prev) =>
          prev.map((x) => (x.id === id ? { ...x, visible: true } : x))
        );
      });

      // auto-dismiss
      const timeout = setTimeout(() => {
        removeToast(id);
      }, ms);
      removeTimers.current[id] = timeout;

      return id;
    },
    [removeToast]
  );

  const showToast = useCallback(
    (message, type = "info", ms = 4000) => addToast(message, type, ms),
    [addToast]
  );

  const value = { showToast, removeToast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        style={{
          position: "fixed",
          right: 20,
          top: 20,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "flex-end",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            style={{
              minWidth: 200,
              maxWidth: 420,
              padding: "10px 14px",
              borderRadius: 8,
              color: "#fff",
              background:
                t.type === "error"
                  ? "#e3342f"
                  : t.type === "success"
                  ? "#16a34a"
                  : "#2563eb",
              boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
              transform: t.visible ? "translateY(0)" : "translateY(-8px)",
              opacity: t.visible ? 1 : 0,
              transition:
                "transform 240ms cubic-bezier(.2,.9,.3,1), opacity 240ms ease",
              cursor: "pointer",
            }}
            onClick={() => removeToast(t.id)}
          >
            {t.message}
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
