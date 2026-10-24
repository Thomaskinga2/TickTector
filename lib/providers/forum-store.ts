import { timingSafeEqual } from "node:crypto";
import { isDemoMode } from "@/lib/mock-data";
import { findTown } from "@/lib/risk-model";
import type { ForumComment, ForumPost } from "@/lib/types";

// Server-only: called from app/api/forum/*.

export type NewPostRecord = Omit<ForumPost, "id" | "createdAt" | "commentCount" | "likeCount">;
export type StoredImage = { bytes: Buffer; type: string };
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
  saveImage(image: StoredImage): Promise<string>; // image id
  getImage(id: string): Promise<StoredImage | null>;
}

type StoredPost = Omit<ForumPost, "commentCount" | "likeCount"> & { likes: number; hidden: boolean };

// Posts saved before post types existed: they had rounded lat/lng, one photoUrl and no county.
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

// Migration: a legacy post becomes a text post. Coordinates are dropped; town and county come from MassGIS.
export function migratePost(post: LegacyPost | StoredPost): StoredPost {
  if ("type" in post) return post;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- lat/lng are dropped on purpose
  const { lat, lng, photoUrl, ...rest } = post;
  const town = findTown(post.townId);
  return { ...rest, type: "text", townName: town?.name ?? post.townId, county: town?.county ?? "", photos: photoUrl ? [photoUrl] : [], likes: 0, hidden: false };
}

const LEGACY_SEED: LegacyPost[] = [
  {
    id: "post-1",
    townId: "amherst",
    lat: 42.39,
    lng: -72.53,
    title: "Deer tick on my dog after Puffer's Pond",
    body: "Found it behind his ear after a walk on the north trail. Leaf litter was thick.",
    tickSpecies: "Deer tick",
    author: "Maya",
    createdAt: "2026-10-22T15:10:00.000Z",
  },
  {
    id: "post-2",
    townId: "amherst",
    lat: 42.37,
    lng: -72.52,
    title: "Two ticks near the campus pond",
    body: "Brushed two off my jeans after sitting on the grass by the pond.",
    author: "Leo",
    createdAt: "2026-10-21T19:45:00.000Z",
  },
  {
    id: "post-3",
    townId: "boston",
    lat: 42.31,
    lng: -71.12,
    title: "Tick at Arnold Arboretum",
    body: "Small one crawling on my sleeve near the hemlock hill path.",
    tickSpecies: "Deer tick",
    author: "Priya",
    createdAt: "2026-10-20T13:00:00.000Z",
  },
  {
    id: "post-4",
    townId: "worcester",
    lat: 42.27,
    lng: -71.79,
    title: "Dog tick in the backyard",
    body: "Bigger tick with white markings on its back, found on the fence by tall grass.",
    tickSpecies: "American dog tick",
    author: "Sam",
    createdAt: "2026-10-18T22:30:00.000Z",
  },
];

type Db = { posts: (LegacyPost | StoredPost)[]; comments: ForumComment[]; reports?: ForumReport[]; images?: Map<string, StoredImage> };

// ponytail: in-memory arrays. They reset on every deploy/cold start, and each Vercel
// instance has its own copy. TODO: real DB (e.g. Supabase) goes in a new ForumStore below.
// Kept on globalThis so all API routes in one server process share the same arrays.
const g = globalThis as { __forumDb?: Db };
g.__forumDb ??= {
  posts: LEGACY_SEED,
  comments: [
    { id: "c-1", postId: "post-1", body: "Same trail, same week. Permethrin on my shoes helped.", author: "Jordan", createdAt: "2026-10-22T17:00:00.000Z" },
    { id: "c-2", postId: "post-1", body: "Save the tick in a bag in case your vet wants to test it.", author: "Ana", createdAt: "2026-10-22T18:20:00.000Z" },
    { id: "c-3", postId: "post-3", body: "Thanks for the heads up, heading there this weekend.", author: "Chris", createdAt: "2026-10-20T16:40:00.000Z" },
  ],
};
// Runs on every server start, so posts already in memory from an older version are migrated too.
const db = Object.assign(g.__forumDb, {
  posts: g.__forumDb.posts.map(migratePost),
  reports: g.__forumDb.reports ?? [],
  images: g.__forumDb.images ?? new Map<string, StoredImage>(),
}) as { posts: StoredPost[]; comments: ForumComment[]; reports: ForumReport[]; images: Map<string, StoredImage> };

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
  async saveImage(image) {
    const id = crypto.randomUUID();
    db.images.set(id, image);
    return id;
  },
  async getImage(id) {
    return db.images.get(id) ?? null;
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
