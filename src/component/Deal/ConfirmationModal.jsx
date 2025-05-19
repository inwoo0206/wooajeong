import React from "react";

const ConfirmationModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "10px",
          padding: "24px",
          width: "400px",
          maxWidth: "90%",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          position: "relative",
        }}
      >
        <button
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            padding: 0,
          }}
          onClick={onClose}
        >
          ×
        </button>
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px" }}>
            거래 중단 요청이 완료되었습니다.
          </h2>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "24px" }}>
            중단 요청 시, 상대방의 동의 또한 필요합니다.
          </p>
          <button
            style={{
              backgroundColor: "#6c7aee",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "12px",
              width: "100%",
              fontSize: "16px",
              cursor: "pointer",
              fontWeight: "500",
            }}
            onClick={onClose}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
