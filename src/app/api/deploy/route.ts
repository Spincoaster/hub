import { NextResponse } from "next/server";

const VERCEL_API = "https://api.vercel.com";

function getConfig() {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  const teamId = process.env.VERCEL_TEAM_ID;
  if (!token || !projectId) return null;
  return { token, projectId, teamId };
}

export async function GET() {
  const config = getConfig();
  if (!config) {
    return NextResponse.json(
      { error: "VERCEL_API_TOKEN or VERCEL_PROJECT_ID is not configured" },
      { status: 500 }
    );
  }

  const teamParam = config.teamId ? `&teamId=${config.teamId}` : "";
  const res = await fetch(
    `${VERCEL_API}/v6/deployments?projectId=${config.projectId}&limit=1${teamParam}`,
    { headers: { Authorization: `Bearer ${config.token}` } }
  );
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch deployments" }, { status: 502 });
  }
  const data = await res.json();
  const deployment = data.deployments?.[0];
  if (!deployment) {
    return NextResponse.json({ status: "unknown" });
  }

  return NextResponse.json({
    status: deployment.readyState,
    url: deployment.url,
    createdAt: deployment.createdAt,
    ready: deployment.ready, // timestamp when deployment became READY
  });
}

export async function POST() {
  const config = getConfig();
  if (!config) {
    return NextResponse.json(
      { error: "VERCEL_API_TOKEN or VERCEL_PROJECT_ID is not configured" },
      { status: 500 }
    );
  }

  // Get latest deployment to redeploy
  const teamParam = config.teamId ? `&teamId=${config.teamId}` : "";
  const listRes = await fetch(
    `${VERCEL_API}/v6/deployments?projectId=${config.projectId}&limit=1&target=production${teamParam}`,
    { headers: { Authorization: `Bearer ${config.token}` } }
  );
  if (!listRes.ok) {
    return NextResponse.json({ error: "Failed to fetch deployments" }, { status: 502 });
  }
  const listData = await listRes.json();
  const latest = listData.deployments?.[0];
  if (!latest) {
    return NextResponse.json({ error: "No existing deployment found" }, { status: 404 });
  }

  // Redeploy
  const teamQuery = config.teamId ? `?teamId=${config.teamId}` : "";
  const redeployRes = await fetch(
    `${VERCEL_API}/v13/deployments${teamQuery}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deploymentId: latest.uid,
        meta: { action: "redeploy" },
        name: latest.name,
        target: "production",
      }),
    }
  );
  if (!redeployRes.ok) {
    const err = await redeployRes.text();
    return NextResponse.json({ error: `Redeploy failed: ${err}` }, { status: 502 });
  }
  const result = await redeployRes.json();
  return NextResponse.json({ id: result.id, status: result.readyState });
}
