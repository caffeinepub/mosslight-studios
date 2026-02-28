import { useState } from 'react';
import AdminGuard from '../components/AdminGuard';
import BlogForm from '../components/BlogForm';
import { useGetBlogPosts, useDeleteBlogPost } from '../hooks/useBlog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, ChevronUp, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminBlogPage() {
  const [showForm, setShowForm] = useState(false);
  const { data: posts = [], isLoading } = useGetBlogPosts();
  const deletePost = useDeleteBlogPost();

  const handleDelete = async (id: string) => {
    try {
      await deletePost.mutateAsync(id);
      toast.success('Blog post deleted');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete post');
    }
  };

  return (
    <AdminGuard>
      <div className="container py-12">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-4xl font-bold">Blog Management</h1>
              <p className="text-muted-foreground mt-1">Create and manage your blog posts</p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              {showForm ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide Form
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  New Post
                </>
              )}
            </Button>
          </div>

          {showForm && (
            <Card>
              <CardContent className="p-6">
                <h2 className="font-serif text-xl font-semibold mb-4">New Blog Post</h2>
                <BlogForm onSuccess={() => setShowForm(false)} />
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex gap-4">
                    <Skeleton className="h-20 w-28 rounded shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No blog posts yet. Write your first post above!
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="p-4 flex gap-4 items-start">
                    {post.image ? (
                      <div className="h-20 w-28 rounded overflow-hidden bg-muted shrink-0">
                        <img
                          src={post.image.getDirectURL()}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-20 w-28 rounded bg-muted/50 shrink-0 flex items-center justify-center">
                        <span className="font-serif text-2xl text-muted-foreground/40">✦</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold leading-tight truncate">{post.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {post.bodyText.slice(0, 120)}
                        {post.bodyText.length > 120 ? '...' : ''}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(post.createdAt)}
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1 shrink-0"
                          disabled={deletePost.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Blog Post</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{post.title}"? This action cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(post.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}
