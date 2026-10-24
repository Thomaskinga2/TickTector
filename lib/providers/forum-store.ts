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

// ponytail: in-memory arrays. They reset on every deploy/cold start, and each Vercel
// instance has its own copy. TODO: real DB (e.g. Supabase) goes in a new ForumStore below.
// Kept on globalThis so all API routes in one server process share the same arrays.
const db = ((globalThis as { __forumDb?: { posts: StoredPost[]; comments: ForumComment[] } }).__forumDb ??= {
  posts: [
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
  ],
  comments: [
    { id: "c-1", postId: "post-1", body: "Same trail, same week. Permethrin on my shoes helped.", author: "Jordan", createdAt: "2026-10-22T17:00:00.000Z" },
    { id: "c-2", postId: "post-1", body: "Save the tick in a bag in case your vet wants to test it.", author: "Ana", createdAt: "2026-10-22T18:20:00.000Z" },
    { id: "c-3", postId: "post-3", body: "Thanks for the heads up, heading there this weekend.", author: "Chris", createdAt: "2026-10-20T16:40:00.000Z" },
  ],
});

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
