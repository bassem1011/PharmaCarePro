import React from "react";

export default function Skeleton({
  width = "100%",
  height = 24,
  className = "",
  style = {},
  rounded = "md",
}) {
  return (
    <div
      className={`bg-gray-200 dark:bg-gray-700 animate-pulse ${
        rounded === "full" ? "rounded-full" : `rounded-${rounded}`
      } ${className}`}
      style={{ width, height, ...style }}
    />
  );
}
