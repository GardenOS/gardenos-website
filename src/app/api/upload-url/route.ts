import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getR2S3Client } from "@/lib/r2-s3";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  try {
    const { filename, contentType } = await req.json();
    const raw = String(filename ?? "scan.las");
    const safeName =
      raw.replace(/^.*[/\\]/, "").replace(/\s+/g, "_").slice(0, 180) || "scan.las";
    const key = `scans/${userId}/${Date.now()}-${safeName}`;

    const s3 = getR2S3Client();
    const url = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 3600 }
    );

    return NextResponse.json({ url, key });
  } catch (e) {
    console.error("POST /api/upload-url:", e);
    return NextResponse.json({ error: "Failed to sign upload URL" }, { status: 500 });
  }
}
