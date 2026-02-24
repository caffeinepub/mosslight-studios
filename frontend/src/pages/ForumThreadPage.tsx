import { useParams, useNavigate } from '@tanstack/react-router';
import { useDiscussionThread } from '../hooks/useDiscussionBoard';
import { Loader2, ArrowLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import PostStatusBadge from '../components/PostStatusBadge';
import ReplyList from '../components/ReplyList';
import AdminReplyForm from '../components/AdminReplyForm';

export default function ForumThreadPage() {
  const { postId } = useParams({ from: '/forum/$postId' });
  const navigate = useNavigate();
  const { data: post, isLoading } = useDiscussionThread(postId);

  if (isLoading) {
    return (
      <div className="container py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container py-20 text-center">
        <p className="text-muted-foreground text-lg">Post not found</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate({ to: '/forum' })}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Forum
        </Button>
      </div>
    );
  }

  const timestamp = new Date(Number(post.timestamp) / 1000000);

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/forum' })}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Forum
        </Button>

        <Card className="shadow-elegant">
          <CardHeader className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <PostStatusBadge status={post.status} />
                  <span className="text-sm text-muted-foreground">
                    Asked by Customer
                  </span>
                </div>
                <h1 className="font-serif text-2xl font-bold leading-tight">
                  {post.question}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {timestamp.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {post.replies.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-serif text-xl font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Replies ({post.replies.length})
            </h2>
            <ReplyList replies={post.replies} />
          </div>
        )}

        <AdminReplyForm postId={postId} />
      </div>
    </div>
  );
}
