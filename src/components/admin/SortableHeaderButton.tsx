"use client";

export type AdminTableSort = "default" | "likes_desc" | "adjusted_likes_desc";

export function parseAdminTableSort(value: string | null): AdminTableSort {
  if (value === "likes_desc" || value === "adjusted_likes_desc") return value;
  return "default";
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: "asc" | "desc";
}) {
  if (direction === "asc") {
    return (
      <svg
        className={`h-3.5 w-3.5 ${active ? "text-blue-400" : "text-zinc-400"}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 19V5" />
        <path d="m18 11-6-6-6 6" />
        <path d="M19 19h-4" />
        <path d="M19 15h-7" />
        <path d="M19 11h-3" />
      </svg>
    );
  }

  return (
    <svg
      className={`h-3.5 w-3.5 ${active ? "text-blue-400" : "text-zinc-400"}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="m18 13-6 6-6-6" />
      <path d="M19 5h-4" />
      <path d="M19 9h-7" />
      <path d="M19 13h-3" />
    </svg>
  );
}

export function SortableHeaderButton({
  label,
  active,
  direction = "desc",
  title,
  onClick,
}: {
  label: string;
  active: boolean;
  direction?: "asc" | "desc";
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-end gap-1 whitespace-nowrap font-medium transition-colors hover:text-white ${
        active ? "text-white" : "text-zinc-400"
      }`}
      title={title}
      aria-label={title}
      aria-pressed={active}
    >
      <span>{label}</span>
      <SortIcon active={active} direction={direction} />
    </button>
  );
}
