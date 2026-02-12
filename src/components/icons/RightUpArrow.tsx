export function RightUpArrow({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 21.43 21.43"
      fill="none"
      stroke="#fff"
      strokeMiterlimit={10}
      strokeWidth={2.09}
    >
      <polyline points=".74 1.05 20.38 1.05 20.38 20.68" />
      <line x1="20.38" y1="1.05" x2="0.74" y2="20.68" />
    </svg>
  );
}
