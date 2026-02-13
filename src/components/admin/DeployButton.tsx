"use client";

import { useState, useEffect, useCallback } from "react";

type DeployStatus = {
  status: string; // QUEUED, BUILDING, READY, ERROR, CANCELED, unknown
  url?: string;
  createdAt?: number;
  ready?: number; // timestamp when deployment became READY
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  QUEUED: { label: "キュー待ち", color: "text-yellow-400" },
  BUILDING: { label: "ビルド中", color: "text-yellow-400" },
  INITIALIZING: { label: "初期化中", color: "text-yellow-400" },
  READY: { label: "デプロイ完了", color: "text-green-400" },
  ERROR: { label: "エラー", color: "text-red-400" },
  CANCELED: { label: "キャンセル", color: "text-zinc-400" },
};

export function DeployButton() {
  const [deploying, setDeploying] = useState(false);
  const [message, setMessage] = useState("");
  const [deployStatus, setDeployStatus] = useState<DeployStatus | null>(null);
  const [polling, setPolling] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/deploy");
      if (res.ok) {
        const data = await res.json();
        setDeployStatus(data);
        return data.status;
      }
    } catch {
      // ignore
    }
    return null;
  }, []);

  const isBuildingStatus = (s: string | null) =>
    s === "QUEUED" || s === "BUILDING" || s === "INITIALIZING";

  // Fetch status on mount; start polling if already building
  useEffect(() => {
    fetchStatus().then((s) => {
      if (isBuildingStatus(s)) setPolling(true);
    });
  }, [fetchStatus]);

  // Poll while building
  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(async () => {
      const status = await fetchStatus();
      if (status && !isBuildingStatus(status)) {
        setPolling(false);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [polling, fetchStatus]);

  const handleDeploy = async () => {
    if (!confirm("デプロイを実行しますか？")) return;
    setDeploying(true);
    setMessage("");
    // Immediately show QUEUED status
    setDeployStatus({ status: "QUEUED", createdAt: Date.now() });
    try {
      const res = await fetch("/api/deploy", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setMessage(`エラー: ${data.error ?? "デプロイに失敗しました"}`);
      } else {
        const data = await res.json();
        // Immediately reflect the new deployment status
        setDeployStatus({
          status: data.status ?? "QUEUED",
          createdAt: Date.now(),
        });
        setPolling(true);
      }
    } catch {
      setMessage("エラー: デプロイリクエストに失敗しました");
    } finally {
      setDeploying(false);
    }
  };

  const isBuilding = deployStatus?.status === "QUEUED" || deployStatus?.status === "BUILDING" || deployStatus?.status === "INITIALIZING";
  const statusInfo = deployStatus?.status ? STATUS_LABELS[deployStatus.status] : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <button
          onClick={handleDeploy}
          disabled={deploying || isBuilding}
          className="rounded-md bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {deploying ? "リクエスト中..." : isBuilding ? "ビルド中..." : "デプロイ"}
        </button>
        {message && (
          <span className={`text-sm ${message.startsWith("エラー") ? "text-red-400" : "text-green-400"}`}>
            {message}
          </span>
        )}
      </div>
      {deployStatus && statusInfo && (
        <div className="text-sm text-zinc-400">
          <div className="flex items-center gap-3">
            <span className={statusInfo.color}>{statusInfo.label}</span>
            {deployStatus.createdAt && (
              <span>開始: {new Date(deployStatus.createdAt).toLocaleString("ja-JP")}</span>
            )}
            {!isBuilding && deployStatus.ready && (
              <span>完了: {new Date(deployStatus.ready).toLocaleString("ja-JP")}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
