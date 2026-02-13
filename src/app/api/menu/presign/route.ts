import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/lib/auth";

const VALID_BARS = ["shinjuku", "ebisu", "kagurazaka"];
const BUCKET = "menu-spincoaster-com";

function getS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION ?? "ap-northeast-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { bar } = await request.json();
  if (!VALID_BARS.includes(bar)) {
    return NextResponse.json({ error: "Invalid bar" }, { status: 400 });
  }

  const key = bar;
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: "application/pdf",
  });

  try {
    const s3 = getS3Client();
    const url = await getSignedUrl(s3, command, { expiresIn: 300 });
    return NextResponse.json({ url, key });
  } catch (err) {
    console.error("Failed to generate presigned URL:", err);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
