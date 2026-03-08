import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { CommentParentType } from "../backendTypes";
import CommentForm from "../components/CommentForm";
import CommentList from "../components/CommentList";
import { useGetBlogPosts } from "../hooks/useBlog";

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogDetailPage() {
  const { id } = useParams({ from: "/blog/$id" });
  const navigate = useNavigate();
  const { data: posts = [], isLoading } = useGetBlogPosts();

  const post = posts.find((p) => p.id === id);

  if (isLoading) {
    return (
      <div className="container py-12 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="aspect-video w-full rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground text-lg">Blog post not found.</p>
        <Button
          variant="link"
          onClick={() => navigate({ to: "/blog" })}
          className="mt-4"
        >
          Back to Blog
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-3xl mx-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ to: "/blog" })}
        className="mb-6 gap-2 -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Blog
      </Button>

      <article className="space-y-6">
        <header className="space-y-3">
          <h1 className="font-serif text-4xl font-bold leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            {formatDate(post.createdAt)}
          </div>
        </header>

        {post.image && (
          <div className="rounded-xl overflow-hidden aspect-video bg-muted">
            <img
              src={post.image.getDirectURL()}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {(() => {
            let offset = 0;
            return post.bodyText.split("\n").map((paragraph) => {
              const key = `line-${offset}`;
              offset += paragraph.length + 1; // +1 for the \n
              return paragraph.trim() ? (
                <p
                  key={key}
                  className="text-base leading-relaxed text-foreground/90 mb-4"
                >
                  {paragraph}
                </p>
              ) : (
                <br key={key} />
              );
            });
          })()}
        </div>
      </article>

      <Separator className="my-10" />

      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-semibold">Comments</h2>
        <CommentList
          parentId={post.id}
          parentType={CommentParentType.blogPost}
        />
        <CommentForm
          parentId={post.id}
          parentType={CommentParentType.blogPost}
        />
      </section>
    </div>
  );
}
