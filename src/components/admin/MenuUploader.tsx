"use client";

import { useState, useRef } from "react";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MenuUploader({ bar }: { bar: string }) {
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const menuUrl = `https://menu.spincoaster.com/${bar}`;

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setStatus("アップロードURLを取得中...");
    setError("");

    try {
      // 1. Get presigned URL
      const presignRes = await fetch("/api/menu/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bar }),
      });
      if (!presignRes.ok) {
        const data = await presignRes.json();
        throw new Error(data.error ?? "Presigned URL取得に失敗しました");
      }
      const { url } = await presignRes.json();

      // 2. Upload directly to S3
      setStatus("S3にアップロード中...");
      const uploadRes = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/pdf" },
        body: file,
      });
      if (!uploadRes.ok) {
        throw new Error("S3へのアップロードに失敗しました");
      }

      // 3. Invalidate CloudFront cache
      setStatus("キャッシュを無効化中...");
      const invalidateRes = await fetch("/api/menu/invalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bar }),
      });
      if (!invalidateRes.ok) {
        const data = await invalidateRes.json();
        throw new Error(data.error ?? "キャッシュ無効化に失敗しました");
      }

      setStatus("アップロード完了");
      if (fileRef.current) fileRef.current.value = "";
      setFileName("");
      setFileSize(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "アップロードに失敗しました");
      setStatus("");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400">
        現在のメニュー:{" "}
        <a
          href={menuUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 underline hover:text-blue-300"
        >
          {menuUrl}
        </a>
      </p>

      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          disabled={uploading}
          onChange={(e) => {
            const f = e.target.files?.[0];
            setFileName(f?.name ?? "");
            setFileSize(f?.size ?? 0);
          }}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="rounded-md border border-zinc-600 bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600 disabled:opacity-50"
        >
          ファイルを選択
        </button>
        <span className="text-sm text-zinc-400">
          {fileName ? `${fileName} (${formatSize(fileSize)})` : "ファイルが選択されていません"}
        </span>
        <button
          onClick={handleUpload}
          disabled={uploading || !fileName}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {uploading ? "処理中..." : "アップロード"}
        </button>
      </div>

      {status && (
        <p className="text-sm text-green-400">{status}</p>
      )}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
