// src/components/ui/GradientIcon.tsx
import React from 'react';

type GradientIconProps = {
  icon: React.ElementType;
  size?: number;
  gradientId: string;
};

export default function GradientIcon({ icon: Icon, size = 100, gradientId }: GradientIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2ECC71" />
          <stop offset="100%" stopColor="#4A90E2" />
        </linearGradient>
      </defs>
      <Icon width={size} height={size} fill={`url(#${gradientId})`} />
    </svg>
  );
}
