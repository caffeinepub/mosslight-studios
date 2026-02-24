import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import PostStatusBadge from './PostStatusBadge';
import type { DiscussionPost } from '../backend';

interface DiscussionPostListProps {
  posts: DiscussionPost[];
}

export default function DiscussionPostList({ posts }: DiscussionPostListProps) {
  const sortedPosts = [...posts].sort((a, b) => 
    Number(b.timestamp) - Number(a.timestamp)
  );

  return (
    <div className="space-y-4">
      {sortedPosts.map((post) => {
        const timestamp = new Date(Number(post.timestamp) / 1000000);
        const replyCount = post.replies.length;

        return (
          <Link key={post.id} to="/forum/$postId" params={{ postId: post.id }}>
            <Card className="hover:shadow-elegant transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-serif text-lg font-semibold line-clamp-2 flex-1">
                      {post.question}
                    </h3>
                    <PostStatusBadge status={post.status} />
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Asked by Customer</span>
                    <span>•</span>
                    <span>
                      {timestamp.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      <span>{replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
