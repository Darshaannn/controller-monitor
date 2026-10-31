import React from "react";
import { MetricStatus } from "@/types/telemetry";

interface StatusBadgeProps {
  status: MetricStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const badgeClass =
    status === "normal"
      ? "badge-normal"
      : status === "warning"
      ? "badge-warning"
      : "badge-critical";

  const label =
    status === "normal" ? "Normal" : status === "warning" ? "Warning" : "Critical";

  return (
    <span
      className={`badge ${badgeClass} text-uppercase`}
      role="status"
      aria-label={`Status: ${label}`}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: "currentColor",
          marginRight: 6,
          display: "inline-block",
        }}
      />
      {label}
    </span>
  );
};
