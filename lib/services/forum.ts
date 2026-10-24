import type { ForumComment, ForumPost, NewPostInput, ScanPostInput } from "@/lib/types";
import { getJson } from "./http";

export function getPosts(townId?: string): Promise<ForumPost[]> {
  return getJson(townId ? `/api/forum/posts?town=${encodeURIComponent(townId)}` : "/api/forum/posts");
}

export function getPost(id: string): Promise<ForumPost> {
  return getJson(`/api/forum/posts/${encodeURIComponent(id)}`);
}

export async function createPost(input: NewPostInput): Promise<ForumPost> {
  const { photos, ...fields } = input;
  const form = new FormData();
  form.append("type", "text");
  for (const [key, value] of Object.entries(fields)) if (value !== undefined) form.append(key, value);
  for (const photo of await Promise.all(photos.map(shrinkImage))) form.append("photos", photo);
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
  form.append("photos", await shrinkImage(blob), "scan.jpg");
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

export function addComment(postId: string, body: string, author: string): Promise<ForumComment> {
  return getJson(`/api/forum/posts/${encodeURIComponent(postId)}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body, author }),
  });
}

// Phone photos are often 3–8 MB and Vercel caps a request at 4.5 MB, so photos are shrunk to a
// 1600 px JPEG in the browser first. Anything the browser can't decode is sent as-is for the server to reject.
const MAX_SIDE = 1600;
async function shrinkImage(file: Blob): Promise<Blob> {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}
