import { NextRequest, NextResponse } from "next/server";
import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from "@aws-sdk/client-cloudfront";
import { auth } from "@/lib/auth";

const VALID_BARS = ["shinjuku", "ebisu", "kagurazaka"];

function getCFClient() {
  return new CloudFrontClient({
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

  const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
  if (!distributionId) {
    return NextResponse.json(
      { error: "CLOUDFRONT_DISTRIBUTION_ID is not configured" },
      { status: 500 }
    );
  }

  const { bar } = await request.json();
  if (!VALID_BARS.includes(bar)) {
    return NextResponse.json({ error: "Invalid bar" }, { status: 400 });
  }

  try {
    const cf = getCFClient();
    const result = await cf.send(
      new CreateInvalidationCommand({
        DistributionId: distributionId,
        InvalidationBatch: {
          CallerReference: `${bar}-${Date.now()}`,
          Paths: {
            Quantity: 1,
            Items: [`/${bar}`],
          },
        },
      })
    );
    return NextResponse.json({
      success: true,
      invalidationId: result.Invalidation?.Id,
    });
  } catch (err) {
    console.error("Failed to create invalidation:", err);
    return NextResponse.json(
      { error: "Failed to invalidate cache" },
      { status: 500 }
    );
  }
}
