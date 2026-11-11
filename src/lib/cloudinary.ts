import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

// Server-only. Every upload goes through our own API routes using this
// signed SDK client — never a direct-from-browser unsigned upload — so the
// cloud name/key/secret never need to reach the client at all.
let configured = false;

export class CloudinaryConfigError extends Error {
  constructor() {
    super("Image upload is not configured on this server yet.");
    this.name = "CloudinaryConfigError";
  }
}

function ensureConfigured() {
  if (configured) return;
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud_name || !api_key || !api_secret) {
    throw new CloudinaryConfigError();
  }
  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
  configured = true;
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

const MAGIC_BYTES = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
} as const;

/** Sniffs the real file content rather than trusting the client-declared
 * MIME type or filename extension, both of which are trivially spoofable —
 * a renamed .exe with a "image/png" Content-Type header would sail through
 * a check that only looked at what the browser claimed. */
export function detectImageType(buffer: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  for (const [mime, bytes] of Object.entries(MAGIC_BYTES)) {
    if (buffer.length >= bytes.length && bytes.every((b, i) => buffer[i] === b)) {
      return mime as "image/jpeg" | "image/png";
    }
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export type ImageValidationError =
  | "missing_file"
  | "too_large"
  | "unsupported_type";

export interface ValidatedImage {
  buffer: Buffer;
  mime: "image/jpeg" | "image/png" | "image/webp";
}

export type ValidateImageResult =
  | { ok: true; image: ValidatedImage }
  | { ok: false; error: ImageValidationError };

/** Reads and validates an uploaded file from FormData: size first (cheap,
 * avoids buffering something huge just to reject it) then real content
 * sniffing. Never trusts `file.type`. */
export async function validateImageUpload(file: File | null): Promise<ValidateImageResult> {
  if (!file || file.size === 0) return { ok: false, error: "missing_file" };
  if (file.size > MAX_IMAGE_BYTES) return { ok: false, error: "too_large" };

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_IMAGE_BYTES) return { ok: false, error: "too_large" };

  const mime = detectImageType(buffer);
  if (!mime) return { ok: false, error: "unsupported_type" };

  return { ok: true, image: { buffer, mime } };
}

export async function uploadImage(
  buffer: Buffer,
  folder: string,
  publicId: string,
): Promise<{ url: string }> {
  ensureConfigured();
  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder, public_id: publicId, overwrite: true, resource_type: "image" },
        (err, res) => {
          if (err || !res) reject(err ?? new Error("Cloudinary upload failed"));
          else resolve(res as { secure_url: string });
        },
      )
      .end(buffer);
  });
  return { url: result.secure_url };
}

const IMAGE_ERROR_MESSAGES: Record<ImageValidationError, string> = {
  missing_file: "No image was uploaded.",
  too_large: `Image is too large — the limit is ${MAX_IMAGE_BYTES / (1024 * 1024)}MB.`,
  unsupported_type: "Unsupported file — please upload a JPEG, PNG, or WebP image.",
};

export function imageValidationErrorResponse(error: ImageValidationError): NextResponse {
  return NextResponse.json({ error: IMAGE_ERROR_MESSAGES[error] }, { status: 400 });
}

/** A missing Cloudinary config is a server operator problem, not the
 * caller's — say so plainly without ever echoing back which specific env
 * var is unset or any part of what is/isn't configured. */
export function configErrorResponse(): NextResponse {
  return NextResponse.json(
    { error: "Image upload isn't available right now — please try again later." },
    { status: 503 },
  );
}
