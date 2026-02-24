import { useState } from 'react';
import { useGetCallerUserRole } from '../hooks/useUserProfile';
import { useReplyToPost } from '../hooks/useDiscussionBoard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

interface AdminReplyFormProps {
  postId: string;
}

export default function AdminReplyForm({ postId }: AdminReplyFormProps) {
  const [replyContent, setReplyContent] = useState('');
  const { data: userRole } = useGetCallerUserRole();
  const replyMutation = useReplyToPost();

  const isAdmin = userRole === 'admin';

  if (!isAdmin) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!replyContent.trim()) {
      toast.error('Please enter a reply');
      return;
    }

    try {
      await replyMutation.mutateAsync({ postId, content: replyContent.trim() });
      toast.success('Reply posted successfully!');
      setReplyContent('');
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply. Please try again.');
    }
  };

  return (
    <Card className="border-primary/30 shadow-elegant">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-primary" />
          Post Admin Reply
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reply">Your Reply</Label>
            <Textarea
              id="reply"
              placeholder="Type your response to this question..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <Button
            type="submit"
            disabled={replyMutation.isPending || !replyContent.trim()}
            className="min-w-32"
          >
            {replyMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              'Post Reply'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
