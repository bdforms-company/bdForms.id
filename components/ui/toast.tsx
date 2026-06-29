"use client";

import React, { useState, useEffect, createContext, useContext, useCallback, useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface ToastProps {
  id: string;
  message: ReactNode;
  type: ToastType;
  duration?: number;
  onDismiss: (id: string) => void;
  className?: string;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 2000, onDismiss, className }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      // Give some time for exit animation if any, then dismiss
      setTimeout(() => onDismiss(id), 300); 
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, id, onDismiss]);

  const baseClasses = "flex items-center p-4 rounded-lg shadow-lg text-white max-w-xs relative overflow-hidden";
  const typeClasses = {
    success: "bg-green-600",
    error: "bg-red-500",
    info: "bg-gray-700",
  };

  if (!visible) return null;

  return (
    <div
      className={cn(baseClasses, typeClasses[type], className)}
      style={{
        position: 'relative', // Ensure relative positioning for animation
        animation: 'slideInRight 0.3s ease-out forwards',
      }}
    >
      {message}
    </div>
  );
};

interface ToastContextType {
  addToast: (message: ReactNode, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Array<Omit<ToastProps, 'onDismiss'>>>([]);
  const toastIdRef = useRef(0);

  const addToast = useCallback((message: ReactNode, type: ToastType = "info", duration?: number) => {
    const id = `toast-${toastIdRef.current++}`;
    setToasts((prevToasts) => {
      const newToasts = [...prevToasts, { id, message, type, duration }];
      // Limit to 3 toasts visible at once (FIFO)
      if (newToasts.length > 3) {
        newToasts.shift();
      }
      return newToasts;
    });
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};