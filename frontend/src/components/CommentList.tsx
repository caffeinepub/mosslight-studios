import { useGetCommentsByParent } from '../hooks/useComments';
import { CommentParentType } from '../backend';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle } from 'lucide-react';

interface CommentListProps {
  parentId: string;
  parentType: CommentParentType;
}

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function CommentList({ parentId, parentType }: CommentListProps) {
  const { data: comments = [], isLoading } = useGetCommentsByParent(parentId, parentType);

  if (isLoading) {
    return (
      <div className="space-y-2 pt-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className="pt-3 text-xs text-muted-foreground flex items-center gap-1">
        <MessageCircle className="h-3 w-3" />
        No comments yet. Be the first!
      </div>
    );
  }

  return (
    <div className="pt-3 space-y-3">
      <p className="text-xs font-medium text-muted-foreground">
        {comments.length} comment{comments.length !== 1 ? 's' : ''}
      </p>
      {comments.map((comment) => (
        <div key={comment.id} className="bg-muted/40 rounded-lg p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{comment.name}</span>
            <span className="text-xs text-muted-foreground">{formatDate(comment.timestamp)}</span>
          </div>
          <p className="text-sm text-foreground/80">{comment.text}</p>
        </div>
      ))}
    </div>
  );
}
