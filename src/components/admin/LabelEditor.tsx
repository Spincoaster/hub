"use client";

import { useState } from "react";

export type LabelRow = {
  id: string;
  key: string;
  value: string;
};

const GROUPS = [
  { prefix: "SITE_NAME", label: "サイト名" },
  { prefix: "BAR_NAMES.", label: "店舗名" },
  { prefix: "NAV.", label: "ナビゲーション" },
  { prefix: "TOP_PAGE.", label: "トップページ" },
  { prefix: "TABLE.", label: "テーブルヘッダー" },
  { prefix: "POPUP.", label: "ポップアップ" },
  { prefix: "SEARCH.", label: "検索" },
];

function groupLabels(labels: LabelRow[]) {
  const grouped: { label: string; items: LabelRow[] }[] = GROUPS.map((g) => ({
    label: g.label,
    items: [],
  }));
  const other: LabelRow[] = [];

  for (const row of labels) {
    let matched = false;
    for (let i = 0; i < GROUPS.length; i++) {
      const g = GROUPS[i];
      if (g.prefix === "SITE_NAME" ? row.key === "SITE_NAME" : row.key.startsWith(g.prefix)) {
        grouped[i].items.push(row);
        matched = true;
        break;
      }
    }
    if (!matched) other.push(row);
  }

  if (other.length > 0) {
    grouped.push({ label: "その他", items: other });
  }
  return grouped.filter((g) => g.items.length > 0);
}

function LabelRowItem({
  label,
  onSave,
}: {
  label: LabelRow;
  onSave: (id: string, value: string) => Promise<void>;
}) {
  const [value, setValue] = useState(label.value);
  const [saving, setSaving] = useState(false);
  const changed = value !== label.value;

  const handleSave = async () => {
    setSaving(true);
    await onSave(label.id, value);
    setSaving(false);
  };

  return (
    <div className="flex items-start gap-2 border-b border-zinc-800 py-2">
      <span className="w-56 shrink-0 pt-2 font-mono text-xs text-zinc-400">
        {label.key}
      </span>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={1}
        className="min-h-[36px] min-w-0 flex-1 resize-y rounded border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-white"
      />
      <button
        onClick={handleSave}
        disabled={!changed || saving}
        className="shrink-0 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-30"
      >
        {saving ? "..." : "保存"}
      </button>
    </div>
  );
}

export function LabelEditor({ labels: initialLabels }: { labels: LabelRow[] }) {
  const [labels, setLabels] = useState(initialLabels);

  const handleSave = async (id: string, value: string) => {
    const res = await fetch(`/api/labels/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    if (res.ok) {
      setLabels((prev) =>
        prev.map((l) => (l.id === id ? { ...l, value } : l))
      );
    }
  };

  const grouped = groupLabels(labels);

  return (
    <div className="space-y-8">
      {grouped.map((group) => (
        <section key={group.label}>
          <h3 className="mb-2 text-lg font-semibold text-white">
            {group.label}
          </h3>
          <div>
            {group.items.map((label) => (
              <LabelRowItem
                key={label.id}
                label={label}
                onSave={handleSave}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
