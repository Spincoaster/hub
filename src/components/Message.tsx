"use client";

import { useEffect, useState } from "react";

type MessageProps = {
  type: "success" | "error" | "info";
  text: string;
};

export function Message({ type, text }: MessageProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const colors = {
    success:
      "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
    error:
      "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
    info: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
  };

  return (
    <div
      className={`mx-auto mt-4 max-w-7xl rounded border px-4 py-3 text-sm ${colors[type]}`}
    >
      <div className="flex items-center justify-between">
        <span>{text}</span>
        <button
          onClick={() => setVisible(false)}
          className="ml-4 opacity-60 hover:opacity-100"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
