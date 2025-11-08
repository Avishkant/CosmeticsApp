import React from "react";

export default function ConfirmModal({
  open,
  title,
  message,
  onCancel,
  onConfirm,
}) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
        }}
        onClick={onCancel}
      />
      <div
        style={{
          background: "#fff",
          borderRadius: 8,
          padding: 18,
          width: 420,
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          zIndex: 10001,
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
        <div style={{ marginBottom: 16 }}>{message}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
