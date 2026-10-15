import { GoogleAuth } from "google-auth-library";

const SPREADSHEET_ID = "1Zl5dVBUjs1Tp2WEhS79GPtqgwQf69N9sNUghiNccdZ8";

function parseServiceAccountKey(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    // dotenv may expand \n to real newlines, breaking JSON string values.
    // Re-escape newlines only inside JSON string literals.
    const fixed = raw.replace(/"(?:[^"\\]|\\.)*"/g, (match) =>
      match.replace(/\n/g, "\\n"),
    );
    return JSON.parse(fixed);
  }
}

export async function getAccessToken(): Promise<string> {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not set");

  const key = parseServiceAccountKey(keyJson);
  const auth = new GoogleAuth({
    credentials: key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  if (!tokenResponse.token) throw new Error("Failed to get access token");
  return tokenResponse.token;
}

export async function fetchSheetData(
  sheetName: string,
  accessToken: string,
): Promise<string[][]> {
  const range = encodeURIComponent(sheetName);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok)
    throw new Error(`Sheets API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return (data.values as string[][]) ?? [];
}
