import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// SafeIcon wraps MaterialCommunityIcons and falls back when an invalid name is provided.
export default function SafeIcon({ name, size = 24, color = "#000", style, ...props }) {
  const glyphMap = MaterialCommunityIcons?.glyphMap || {};
  let resolvedName = name;

  if (typeof resolvedName === "string" && !glyphMap[resolvedName]) {
    // If an outline variant is invalid, try its base name (without -outline)
    if (resolvedName.endsWith("-outline")) {
      const base = resolvedName.replace(/-outline$/, "");
      if (glyphMap[base]) {
        resolvedName = base;
      }
    }
  }

  if (!glyphMap[resolvedName]) {
    console.warn(
      `Invalid MaterialCommunity icon name '${name}', falling back to 'help-circle'.`
    );
    resolvedName = "help-circle";
  }

  return (
    <MaterialCommunityIcons
      name={resolvedName}
      size={size}
      color={color}
      style={style}
      {...props}
    />
  );
}