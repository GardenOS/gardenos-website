import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getR2S3Client } from "@/lib/r2-s3";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  try {
    const s3 = getR2S3Client();
    const prefix = `scans/${userId}/`;
    const out = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
      })
    );

    const scans =
      out.Contents?.map((obj) => ({
        key: obj.Key ?? "",
        size: obj.Size ?? 0,
        lastModified: obj.LastModified?.toISOString() ?? null,
      })).filter((row) => row.key.length > 0) ?? [];

    return NextResponse.json({ scans });
  } catch (e) {
    console.error("GET /api/scans:", e);
    return NextResponse.json({ error: "Failed to list scans" }, { status: 500 });
  }
}
