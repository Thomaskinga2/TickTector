import { Suspense } from "react";
import { Page } from "@/components/page";
import { LoadingState } from "@/components/states";
import { PostView } from "./post-view";

// The post id is only known at request time, so it must be read inside Suspense (Cache Components).
export default function PostPage({ params }: PageProps<"/forum/[id]">) {
  return (
    <Suspense fallback={<Page><LoadingState /></Page>}>
      <PostContent params={params} />
    </Suspense>
  );
}

async function PostContent({ params }: Pick<PageProps<"/forum/[id]">, "params">) {
  const { id } = await params;
  return <PostView postId={id} />;
}
