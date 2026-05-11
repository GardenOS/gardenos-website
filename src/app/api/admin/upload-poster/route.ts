import { NextResponse } from "next/server";
import { requireAdminUser } from "@/backend/auth/admin";
import { errorJson } from "@/backend/common/http";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function getAwsErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const maybeCode = (error as { Code?: unknown }).Code;
  if (typeof maybeCode === "string") return maybeCode;
  const maybeName = (error as { name?: unknown }).name;
  if (typeof maybeName === "string") return maybeName;
  return undefined;
}

function getS3Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Missing R2 credentials");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function POST(request: Request) {
  try {
    await requireAdminUser();

    const bucket = process.env.R2_BUCKET_NAME;
    if (!bucket) throw new Error("Missing R2_BUCKET_NAME");

    const publicBase = process.env.R2_PUBLIC_URL;
    if (!publicBase) throw new Error("Missing R2_PUBLIC_URL");

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const key = `posters/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100)}`;
    const arrayBuffer = await file.arrayBuffer();

    const s3 = getS3Client();

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: new Uint8Array(arrayBuffer),
        ContentType: file.type,
      })
    );

    const publicUrl = `${publicBase.replace(/\/$/, "")}/${key}`;
    return NextResponse.json({ publicUrl, key });
  } catch (error) {
    const awsCode = getAwsErrorCode(error);
    if (awsCode === "AccessDenied") {
      return NextResponse.json(
        {
          error:
            "R2 access denied. Please update the R2 API token to include write permissions for this bucket.",
        },
        { status: 502 }
      );
    }
    return errorJson(error);
  }
}
