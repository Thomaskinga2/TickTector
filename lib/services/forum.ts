import type { ForumComment, ForumPost, NewPostInput } from "@/lib/types";
import { getJson } from "./http";

export function getPosts(townId?: string): Promise<ForumPost[]> {
  return getJson(townId ? `/api/forum/posts?town=${encodeURIComponent(townId)}` : "/api/forum/posts");
}

export function getPost(id: string): Promise<ForumPost> {
  return getJson(`/api/forum/posts/${encodeURIComponent(id)}`);
}

export function createPost(input: NewPostInput): Promise<ForumPost> {
  const form = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) form.append(key, value instanceof File ? value : String(value));
  }
  return getJson("/api/forum/posts", { method: "POST", body: form });
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
