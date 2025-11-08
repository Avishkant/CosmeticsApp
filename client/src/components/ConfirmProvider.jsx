import React, { createContext, useContext, useState, useCallback } from "react";
import ConfirmModal from "./ConfirmModal";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({
    open: false,
    title: "",
    message: "",
    resolver: null,
  });

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setState({
        open: true,
        title: options.title || "Confirm",
        message: options.message || "",
        resolver: resolve,
      });
    });
  }, []);

  const handleCancel = () => {
    if (state.resolver) state.resolver(false);
    setState({ open: false, title: "", message: "", resolver: null });
  };

  const handleConfirm = () => {
    if (state.resolver) state.resolver(true);
    setState({ open: false, title: "", message: "", resolver: null });
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal
        open={state.open}
        title={state.title}
        message={state.message}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx.confirm;
}

export default ConfirmProvider;
