"use client";

import { useRouter } from "next/navigation";
import { NewPostForm } from "@/components/new-post-form";
import { Page } from "@/components/page";
import { createPost } from "@/lib/services/forum";

export default function NewPostPage() {
  const router = useRouter();

  return (
    <Page title="Report a sighting">
      <NewPostForm
        onSubmit={async (input) => {
          await createPost(input);
          router.push("/forum");
        }}
      />
    </Page>
  );
}
