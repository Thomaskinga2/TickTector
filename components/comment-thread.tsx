"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { formatDate } from "@/components/forum-post-card";
import { ReportButton } from "@/components/report-button";
import { slotStatus, type SlotProps } from "@/components/states";
import { Button } from "@/components/ui/button";
import type { ForumComment } from "@/lib/types";

export function CommentThread({
  comments,
  onSend,
  ...slot
}: { comments?: ForumComment[]; onSend: (body: string, author: string) => Promise<void> } & SlotProps) {
  // TODO: real-time chat: subscribe to new comments for this post (e.g. Supabase Realtime) and append them.
  const status = slotStatus(slot, !comments?.length, "No comments yet. Start the conversation.");

  return (
    <div className="flex flex-col gap-4">
      {status ?? (
        <ul className="flex flex-col divide-y rounded-lg border bg-card">
          {comments?.map((c) => (
            <li key={c.id} className="flex flex-col gap-1 p-4">
              <p>{c.body}</p>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {c.author}, {formatDate(c.createdAt)}
                </span>
                <ReportButton label={`Report comment by ${c.author}`} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <CommentForm onSend={onSend} />
    </div>
  );
}

function CommentForm({ onSend }: { onSend: (body: string, author: string) => Promise<void> }) {
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      await onSend(body, author);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label htmlFor="comment-body" className="font-medium">
        Add a comment
      </label>
      <textarea
        id="comment-body"
        required
        maxLength={1000}
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full rounded-lg border bg-card p-3 text-base"
      />
      <div className="flex gap-2">
        <input
          aria-label="Display name"
          placeholder="Display name"
          required
          maxLength={40}
          autoComplete="nickname"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="h-12 min-w-0 flex-1 rounded-lg border bg-card px-3 text-base"
        />
        <Button type="submit" className="h-12 px-4 text-base" disabled={sending}>
          {sending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Send className="size-5" aria-hidden />}
          Send
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-risk-high">
          {error}
        </p>
      )}
    </form>
  );
}
