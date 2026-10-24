"use client";

import { useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { formatRelative } from "@/components/format";
import { ReportButton } from "@/components/report-button";
import { slotStatus, type SlotProps } from "@/components/states";
import { Button } from "@/components/ui/button";
import { List } from "@/components/ui/list";
import type { ForumComment } from "@/lib/types";

export function CommentThread({
  comments,
  onSend,
  onReport,
  ...slot
}: {
  comments?: ForumComment[];
  onSend: (body: string, author: string) => Promise<void>;
  onReport: (commentId: string) => Promise<unknown>;
} & SlotProps) {
  // TODO: real-time chat: subscribe to new comments for this post (e.g. Supabase Realtime) and append them.
  const status = slotStatus(slot, !comments?.length, "No comments yet. Start the conversation.");

  return (
    <div className="flex flex-col gap-3">
      {status ?? (
        <List label="Comments">
          {comments?.map((c) => (
            <li key={c.id} className="flex flex-col gap-0.5 px-4 pt-3 pb-1">
              <p className="type-subhead font-semibold">
                {c.author} <span className="font-normal text-muted-foreground">· {formatRelative(c.createdAt)}</span>
              </p>
              <p className="break-words whitespace-pre-line type-body">{c.body}</p>
              <ReportButton label={`Report comment by ${c.author}`} onReport={() => onReport(c.id)} className="type-footnote" />
            </li>
          ))}
        </List>
      )}
      <CommentForm onSend={onSend} />
    </div>
  );
}

// A Messages-style composer: the comment, a display name, and a round send button.
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
    <form onSubmit={submit} className="flex flex-col gap-2 rounded-xl bg-card p-3">
      <label htmlFor="comment-body" className="sr-only">
        Add a comment
      </label>
      <textarea
        id="comment-body"
        required
        maxLength={1000}
        rows={2}
        placeholder="Add a comment"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full resize-none bg-transparent px-1 type-body outline-none placeholder:text-muted-foreground"
      />
      <div className="flex items-center gap-2 border-t border-separator pt-2">
        <input
          aria-label="Display name"
          placeholder="Your display name"
          required
          maxLength={40}
          autoComplete="nickname"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className="h-9 min-w-0 flex-1 rounded-full bg-fill px-3 type-subhead outline-none placeholder:text-muted-foreground"
        />
        <Button type="submit" size="icon-sm" disabled={sending} aria-label="Send comment">
          {sending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ArrowUp className="size-5" strokeWidth={2.6} aria-hidden />}
        </Button>
      </div>
      {error && (
        <p role="alert" className="px-1 type-footnote text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
