import React from "react";

const base =
  "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
const variants = {
  default: "bg-primary text-white hover:bg-primary/90",
  outline:
    "border border-primary text-primary bg-transparent hover:bg-primary/10",
  ghost: "bg-transparent text-primary hover:bg-primary/10",
};
const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-8 py-3 text-lg",
};

export const Button = React.forwardRef(function Button(
  { variant = "default", size = "md", className = "", ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={[
        base,
        variants[variant] || variants.default,
        sizes[size] || sizes.md,
        className,
      ].join(" ")}
      {...props}
    />
  );
});

export default Button;
