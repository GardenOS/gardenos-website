import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { getR2S3Client } from "@/lib/r2-s3";
import { requireAdminUser } from "@/backend/auth/admin";
import { errorJson } from "@/backend/common/http";

export const runtime = "nodejs";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: Request) {
  try {
    await requireAdminUser();

    const bucket = process.env.R2_BUCKET_NAME;
    if (!bucket) throw new Error("Server misconfiguration: missing R2_BUCKET_NAME");

    const publicBase = process.env.R2_PUBLIC_URL;
    if (!publicBase) throw new Error("Server misconfiguration: missing R2_PUBLIC_URL");

    const body = (await request.json().catch(() => ({}))) as { filename?: string; contentType?: string };
    const contentType = String(body.contentType ?? "image/jpeg");

    if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "Only image files are allowed (jpeg, png, webp, gif)." }, { status: 400 });
    }

    const raw = String(body.filename ?? "poster.jpg");
    const safeName = raw.replace(/^.*[/\\]/, "").replace(/\s+/g, "_").slice(0, 180) || "poster.jpg";
    const key = `posters/${Date.now()}-${safeName}`;

    const s3 = getR2S3Client();
    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 3600 }
    );

    const publicUrl = `${publicBase.replace(/\/$/, "")}/${key}`;
    return NextResponse.json({ uploadUrl, publicUrl, key });
  } catch (error) {
    return errorJson(error);
  }
}
