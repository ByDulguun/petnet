import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { withErrorHandling } from "@/lib/api-handler";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import {
  CloudinaryConfigError,
  configErrorResponse,
  imageValidationErrorResponse,
  uploadImage,
  validateImageUpload,
} from "@/lib/cloudinary";
import { postInputSchema } from "@/lib/validations/community";
import {
  addPostImage,
  createPost,
  getFeedPosts,
  getPostById,
  MAX_POST_IMAGES,
} from "@/server/services/community-service";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await auth();
  const { searchParams } = request.nextUrl;
  const followingOnly = searchParams.get("filter") === "following";
  const cursor = searchParams.get("cursor") ?? undefined;

  if (followingOnly && !session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const result = await getFeedPosts({ viewerId: session?.user?.id, followingOnly, cursor });
  return NextResponse.json(result);
});

// A post's photos ride along in the same multipart request as its text
// rather than a separate upload-after-create step (Lost & Found/Adoption's
// pattern) — a Post has no edit page to land on afterward, and creating
// the post first with an empty body while photos are "about to" attach
// would leave a real gap where the post briefly (or permanently, if the
// upload fails) has neither text nor images.
export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const limit = await checkRateLimit(`community:post:${session.user.id}`, {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterSeconds!);

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const parsed = postInputSchema.safeParse({
    body: formData.get("body") ?? "",
    petId: formData.get("petId") ?? "",
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the form for errors", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const files = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_POST_IMAGES) {
    return NextResponse.json({ error: `You can add up to ${MAX_POST_IMAGES} photos` }, { status: 400 });
  }
  if (!parsed.data.body && files.length === 0) {
    return NextResponse.json({ error: "Write something or add a photo" }, { status: 400 });
  }

  // Validate every image before creating anything — a bad file shouldn't
  // leave a text-less orphan post behind.
  const validated = [];
  for (const file of files) {
    const result = await validateImageUpload(file);
    if (!result.ok) return imageValidationErrorResponse(result.error);
    validated.push(result.image);
  }

  if (validated.length > 0) {
    const uploadLimit = await checkRateLimit(`upload:${session.user.id}`, {
      limit: 20,
      windowMs: 60 * 60 * 1000,
    });
    if (!uploadLimit.allowed) return rateLimitResponse(uploadLimit.retryAfterSeconds!);
  }

  const post = await createPost(session.user.id, {
    body: parsed.data.body || null,
    petId: parsed.data.petId || null,
  });

  try {
    for (const [i, image] of validated.entries()) {
      const publicId = `${post.id}-${i}-${Date.now()}`;
      const { url } = await uploadImage(image.buffer, "petnet/community", publicId);
      await addPostImage(post.id, session.user.id, url, publicId);
    }
  } catch (err) {
    if (err instanceof CloudinaryConfigError) return configErrorResponse();
    throw err;
  }

  return NextResponse.json({ post: await getPostById(post.id, session.user.id) }, { status: 201 });
});
