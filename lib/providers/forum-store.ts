import { isDemoMode } from "@/lib/mock-data";
import type { ForumComment, ForumPost } from "@/lib/types";

// Server-only: called from app/api/forum/*.

export type NewPostRecord = Omit<ForumPost, "id" | "createdAt" | "commentCount">;

export interface ForumStore {
  listPosts(townId?: string): Promise<ForumPost[]>;
  getPost(id: string): Promise<ForumPost | null>;
  createPost(post: NewPostRecord): Promise<ForumPost>;
  listComments(postId: string): Promise<ForumComment[]>;
  addComment(postId: string, body: string, author: string): Promise<ForumComment>;
  // Returns the id the photo is served under (/api/forum/photos/:id).
  savePhoto(jpeg: Uint8Array): Promise<string>;
  getPhoto(id: string): Promise<Uint8Array | null>;
}

type StoredPost = Omit<ForumPost, "commentCount">;

// ~1 km precision, so a post never reveals someone's exact home.
// API routes apply this on the way in and on the way out, whatever the store is.
export const roundCoord = (n: number) => Math.round(n * 100) / 100;
export const redactPost = (post: ForumPost): ForumPost => ({
  ...post,
  lat: roundCoord(post.lat),
  lng: roundCoord(post.lng),
});

// Photos carry EXIF (often the exact GPS spot), so every JPEG is stored without its metadata segments:
// APP1–APP15 (EXIF, XMP, ICC, ...) and comments are dropped; the image data itself is untouched.
// Returns null if the bytes aren't a well-formed JPEG.
export function stripJpegMetadata(bytes: Uint8Array): Uint8Array | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  const kept: Uint8Array[] = [bytes.subarray(0, 2)];
  let i = 2;
  while (i + 4 <= bytes.length) {
    if (bytes[i] !== 0xff) return null;
    const marker = bytes[i + 1];
    // Start of scan: the rest is image data.
    if (marker === 0xda) return concat([...kept, bytes.subarray(i)]);
    const end = i + 2 + ((bytes[i + 2] << 8) | bytes[i + 3]);
    if (end > bytes.length) return null;
    const metadata = (marker >= 0xe1 && marker <= 0xef) || marker === 0xfe;
    if (!metadata) kept.push(bytes.subarray(i, end));
    i = end;
  }
  return null;
}

function concat(parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

// ponytail: in-memory arrays. They reset on every deploy/cold start, and each Vercel
// instance has its own copy. TODO: real DB (e.g. Supabase) goes in a new ForumStore below.
// Kept on globalThis so all API routes in one server process share the same arrays.
type MemoryDb = { posts: StoredPost[]; comments: ForumComment[]; photos: Map<string, Uint8Array> };
const db: MemoryDb = ((globalThis as { __forumDb?: MemoryDb }).__forumDb ??= {
  // Starts empty: every sighting shown is one a real person posted.
  posts: [],
  comments: [],
  photos: new Map(),
});
(db as Partial<MemoryDb>).photos ??= new Map(); // A dev server that was running before photos existed.

// Photos are kept in memory too, so cap them (about 500 KB each after the browser resizes them).
const MAX_PHOTOS = 200;

const withCount = (post: StoredPost): ForumPost => ({
  ...post,
  commentCount: db.comments.filter((c) => c.postId === post.id).length,
});

export const mockForumStore: ForumStore = {
  async listPosts(townId) {
    return db.posts
      .filter((p) => !townId || p.townId === townId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(withCount);
  },
  async getPost(id) {
    const post = db.posts.find((p) => p.id === id);
    return post ? withCount(post) : null;
  },
  async createPost(input) {
    const post = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    db.posts.push(post);
    return withCount(post);
  },
  async listComments(postId) {
    return db.comments.filter((c) => c.postId === postId);
  },
  async addComment(postId, body, author) {
    const comment = { id: crypto.randomUUID(), postId, body, author, createdAt: new Date().toISOString() };
    db.comments.push(comment);
    return comment;
  },
  async savePhoto(jpeg) {
    if (db.photos.size >= MAX_PHOTOS) throw new Error("Photo storage is full. Post without a photo for now.");
    const id = crypto.randomUUID();
    db.photos.set(id, jpeg);
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
