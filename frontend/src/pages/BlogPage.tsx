import { useGetBlogPosts } from '../hooks/useBlog';
import BlogCard from '../components/BlogCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function BlogPage() {
  const { data: posts = [], isLoading } = useGetBlogPosts();

  return (
    <div className="container py-12">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl font-bold">Blog</h1>
          <p className="text-muted-foreground text-lg">
            Stories, process breakdowns, and inspiration from the studio
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <div className="p-5 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              No blog posts yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
