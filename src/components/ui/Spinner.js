import React from "react";

export default function Spinner({ size = 48, className = "" }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        className="animate-spin text-primary"
        width={size}
        height={size}
        viewBox="0 0 50 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="25"
          cy="25"
          r="20"
          stroke="currentColor"
          strokeWidth="6"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M25 5a20 20 0 0 1 20 20h-6a14 14 0 1 0-14 14v6A20 20 0 0 1 25 5z"
        />
      </svg>
    </div>
  );
}
