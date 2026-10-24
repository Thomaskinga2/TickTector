import { timingSafeEqual } from "node:crypto";
import { isDemoMode } from "@/lib/mock-data";
import { findTown, MA_TOWNS } from "@/lib/providers/risk";
import type { ForumComment, ForumPost } from "@/lib/types";

// Server-only: called from app/api/forum/*.

export type NewPostRecord = Omit<ForumPost, "id" | "createdAt" | "commentCount" | "likeCount">;
export type StoredPhoto = { bytes: Buffer; type: string };
export type ForumReport = { id: string; postId: string; commentId?: string; reason: string; createdAt: string };

export interface ForumStore {
  listPosts(townId?: string): Promise<ForumPost[]>; // newest first, hidden posts left out
  getPost(id: string): Promise<ForumPost | null>; // null when missing or hidden
  createPost(post: NewPostRecord): Promise<ForumPost>;
  listComments(postId: string): Promise<ForumComment[]>;
  addComment(postId: string, body: string, author: string): Promise<ForumComment>;
  like(postId: string, liked: boolean): Promise<number | null>; // new like count, null if no such post
  addReport(report: Omit<ForumReport, "id" | "createdAt">): Promise<void>;
  listReports(): Promise<ForumReport[]>;
  setHidden(postId: string, hidden: boolean): Promise<boolean>;
  // Returns the id the photo is served under (/api/forum/photos/:id). Only cleaned photos (lib/forum-images.ts).
  savePhoto(photo: StoredPhoto): Promise<string>;
  getPhoto(id: string): Promise<StoredPhoto | null>;
}

// "Amherst", "north adams" or "north-adams" -> the town with its county (US Census, lib/data/ma-towns.json).
// undefined = not one of the 351 Massachusetts cities and towns.
export const townFromName = (name: string) => {
  const q = name.trim().toLowerCase();
  return MA_TOWNS.find((t) => t.name.toLowerCase() === q || t.id === q.replace(/\s+/g, "-"));
};

type StoredPost = Omit<ForumPost, "commentCount" | "likeCount"> & { likes: number; hidden: boolean };

// Posts saved before post types existed: rounded lat/lng, one photoUrl, no county.
type LegacyPost = {
  id: string;
  townId: string;
  lat?: number;
  lng?: number;
  title: string;
  body: string;
  photoUrl?: string;
  tickSpecies?: string;
  author: string;
  createdAt: string;
};

// Migration: a legacy post becomes a text post. Coordinates are dropped; town and county come from ma-towns.json.
export function migratePost(post: LegacyPost | StoredPost): StoredPost {
  if ("type" in post) return post;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- lat/lng are dropped on purpose
  const { lat, lng, photoUrl, ...rest } = post;
  const town = findTown(post.townId);
  return { ...rest, type: "text", townName: town?.name ?? post.townId, county: town?.county ?? "", photos: photoUrl ? [photoUrl] : [], likes: 0, hidden: false };
}

type Db = {
  posts: (LegacyPost | StoredPost)[];
  comments: ForumComment[];
  reports?: ForumReport[];
  photos?: Map<string, StoredPhoto | Uint8Array>; // Uint8Array: a JPEG saved before photo types were stored
};

// ponytail: in-memory arrays. They reset on every deploy/cold start, and each Vercel
// instance has its own copy. TODO: real DB (e.g. Supabase) goes in a new ForumStore below.
// Kept on globalThis so all API routes in one server process share the same arrays.
// Starts empty: every sighting shown is one a real person posted.
const g = globalThis as { __forumDb?: Db };
g.__forumDb ??= { posts: [], comments: [] };
// Runs on every server start, so posts and photos already in memory from an older version are migrated too.
const db = Object.assign(g.__forumDb, {
  posts: g.__forumDb.posts.map(migratePost),
  reports: g.__forumDb.reports ?? [],
  photos: new Map(
    [...(g.__forumDb.photos ?? [])].map(([id, p]) => [id, p instanceof Uint8Array ? { bytes: Buffer.from(p), type: "image/jpeg" } : p]),
  ),
}) as { posts: StoredPost[]; comments: ForumComment[]; reports: ForumReport[]; photos: Map<string, StoredPhoto> };

// Photos are kept in memory too, so cap them (about 500 KB each after the browser resizes them).
const MAX_PHOTOS = 200;

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- hidden stays server-side
const toPost = ({ likes, hidden, ...post }: StoredPost): ForumPost => ({
  ...post,
  commentCount: db.comments.filter((c) => c.postId === post.id).length,
  likeCount: likes,
});
const visible = (id: string) => db.posts.find((p) => p.id === id && !p.hidden);

export const mockForumStore: ForumStore = {
  async listPosts(townId) {
    return db.posts
      .filter((p) => !p.hidden && (!townId || p.townId === townId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toPost);
  },
  async getPost(id) {
    const post = visible(id);
    return post ? toPost(post) : null;
  },
  async createPost(input) {
    const post: StoredPost = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString(), likes: 0, hidden: false };
    db.posts.push(post);
    return toPost(post);
  },
  async listComments(postId) {
    return db.comments.filter((c) => c.postId === postId);
  },
  async addComment(postId, body, author) {
    const comment = { id: crypto.randomUUID(), postId, body, author, createdAt: new Date().toISOString() };
    db.comments.push(comment);
    return comment;
  },
  async like(postId, liked) {
    const post = visible(postId);
    if (!post) return null;
    post.likes = Math.max(0, post.likes + (liked ? 1 : -1));
    return post.likes;
  },
  async addReport(report) {
    db.reports.push({ ...report, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
  },
  async listReports() {
    return db.reports;
  },
  async setHidden(postId, hidden) {
    const post = db.posts.find((p) => p.id === postId);
    if (post) post.hidden = hidden;
    return !!post;
  },
  async savePhoto(photo) {
    if (db.photos.size >= MAX_PHOTOS) throw new Error("Photo storage is full. Post without a photo for now.");
    const id = crypto.randomUUID();
    db.photos.set(id, photo);
    return id;
  },
  async getPhoto(id) {
    return db.photos.get(id) ?? null;
  },
};

export function getForumStore(): ForumStore {
  if (isDemoMode()) return mockForumStore;
  switch (process.env.FORUM_STORE ?? "mock") {
    case "mock":
      return mockForumStore;
    case "supabase":
      throw new Error("TODO: Supabase forum store not implemented");
    default:
      throw new Error(`Unknown FORUM_STORE: ${process.env.FORUM_STORE}`);
  }
}

// Moderators send the FORUM_MOD_TOKEN env value in an "x-mod-token" header. Unset token = nobody can moderate.
export function isModerator(request: Request) {
  const token = Buffer.from(process.env.FORUM_MOD_TOKEN ?? "");
  const given = Buffer.from(request.headers.get("x-mod-token") ?? "");
  return token.length > 0 && given.length === token.length && timingSafeEqual(given, token);
}
