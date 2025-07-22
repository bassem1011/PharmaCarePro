import React from "react";

export function Card({ className = "", ...props }) {
  return (
    <div
      className={[
        "bg-background border border-border rounded-2xl shadow-sm",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export function CardHeader({ className = "", ...props }) {
  return <div className={["p-6 pb-0", className].join(" ")} {...props} />;
}

export function CardTitle({ className = "", ...props }) {
  return (
    <h3
      className={["text-xl font-bold mb-2", className].join(" ")}
      {...props}
    />
  );
}

export function CardContent({ className = "", ...props }) {
  return <div className={["p-6 pt-2", className].join(" ")} {...props} />;
}

export function CardDescription({ className = "", ...props }) {
  return (
    <p className={["text-muted-foreground", className].join(" ")} {...props} />
  );
}
