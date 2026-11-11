import { NextResponse } from "next/server";

/**
 * Wraps a Route Handler so an unexpected throw (DB unreachable, a
 * Cloudinary SDK error that isn't CloudinaryConfigError, etc.) becomes the
 * same `{ error }` JSON shape every other failure path in this app already
 * returns, instead of Next's default non-JSON 500 page. Client code
 * consistently does `const data = await res.json(); ...data.error`, so an
 * unwrapped throw doesn't leak anything sensitive — it just breaks that
 * parsing and shows a cryptic message instead of a clean one.
 *
 * Never leave a route handler catching its own unexpected errors with a
 * bespoke try/catch; use this instead so the shape stays uniform. Handlers
 * should still return their own typed error responses (401/403/404/409/
 * etc.) for expected failure paths — this only catches what nothing else
 * caught.
 */
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      console.error("[api]", err);
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 },
      );
    }
  };
}
