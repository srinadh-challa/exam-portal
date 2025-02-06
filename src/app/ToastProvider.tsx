"use client";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export function showErrorToast(message: string) {
  toast.error(message, {
    position: "top-center",
    autoClose: 5000, // 5 seconds
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    style: {
      background: "linear-gradient(135deg, #FF6A6A, #D63031)", // 🔥 Red gradient background
      color: "#FFF", // White text
      borderRadius: "10px", // Rounded corners
      padding: "16px", // More padding for better spacing
      fontWeight: "bold",
      fontSize: "16px",
      boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.3)", // Subtle shadow
    },
      icon: () => <span style={{ fontSize: "20px" }}>🚨</span>, // ✅ Fixed icon    
  });
}

export function ToastNotification() {
  return <ToastContainer />;
}
