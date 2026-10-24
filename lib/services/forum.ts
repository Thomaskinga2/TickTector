import { preparePhoto } from "@/lib/photo";
import type { ForumComment, ForumPost, NewPostInput, ScanPostInput } from "@/lib/types";
import { getJson } from "./http";

export function getPosts(townId?: string): Promise<ForumPost[]> {
  return getJson(townId ? `/api/forum/posts?town=${encodeURIComponent(townId)}` : "/api/forum/posts");
}

export function getPost(id: string): Promise<ForumPost> {
  return getJson(`/api/forum/posts/${encodeURIComponent(id)}`);
}

// Photos arrive already resized by the form (preparePhoto); the server validates and strips them again.
export function createPost(input: NewPostInput): Promise<ForumPost> {
  const { photos, ...fields } = input;
  const form = new FormData();
  form.append("type", "text");
  for (const [key, value] of Object.entries(fields)) if (value !== undefined) form.append(key, value);
  for (const photo of photos) form.append("photos", photo);
  return getJson("/api/forum/posts", { method: "POST", body: form });
}

// The scan screen's Post button calls this. Contract and example call: ScanPostInput in lib/types.ts.
export async function createScanPost(scan: ScanPostInput): Promise<ForumPost> {
  const { photo, location, ...fields } = scan; // location.lat/lng stop here: they are never sent
  const form = new FormData();
  form.append("type", "scan");
  form.append("town", location.town);
  for (const [key, value] of Object.entries(fields)) if (value !== undefined) form.append(key, String(value));
  const blob = typeof photo === "string" ? await fetch(photo).then((r) => r.blob()) : photo;
  const file = blob instanceof File ? blob : new File([blob], "scan.jpg", { type: blob.type || "image/jpeg" });
  // In the browser, resize to a JPEG under Vercel's 4.5 MB request cap. Outside it (tests), the server checks it as-is.
  form.append("photos", typeof document === "undefined" ? file : await preparePhoto(file));
  return getJson("/api/forum/posts", { method: "POST", body: form });
}

export function likePost(id: string, liked: boolean): Promise<{ likeCount: number }> {
  return getJson(`/api/forum/posts/${encodeURIComponent(id)}/like`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ liked }),
  });
}

export function reportPost(id: string, commentId?: string): Promise<{ reported: true }> {
  return getJson(`/api/forum/posts/${encodeURIComponent(id)}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commentId }),
  });
}

export function getComments(postId: string): Promise<ForumComment[]> {
  return getJson(`/api/forum/posts/${encodeURIComponent(postId)}/comments`);
}

// Needs a signed-in user; the comment is theirs.
export function addComment(postId: string, body: string): Promise<ForumComment> {
  return getJson(`/api/forum/posts/${encodeURIComponent(postId)}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
}
