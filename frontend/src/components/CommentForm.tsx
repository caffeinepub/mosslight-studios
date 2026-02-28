import { useState } from 'react';
import { useAddComment } from '../hooks/useComments';
import { CommentParentType } from '../backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CommentFormProps {
  parentId: string;
  parentType: CommentParentType;
}

export default function CommentForm({ parentId, parentType }: CommentFormProps) {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const addComment = useAddComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;

    try {
      await addComment.mutateAsync({ parentId, parentType, name: name.trim(), text: text.trim() });
      toast.success('Comment posted!');
      setName('');
      setText('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to post comment');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-4 border-t">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
        <MessageCircle className="h-4 w-4" />
        Leave a comment
      </div>
      <div className="grid grid-cols-1 gap-3">
        <div>
          <Label htmlFor={`name-${parentId}`} className="text-xs mb-1 block">
            Your name
          </Label>
          <Input
            id={`name-${parentId}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            required
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label htmlFor={`text-${parentId}`} className="text-xs mb-1 block">
            Comment
          </Label>
          <Textarea
            id={`text-${parentId}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your comment..."
            required
            rows={3}
            className="text-sm resize-none"
          />
        </div>
      </div>
      <Button
        type="submit"
        size="sm"
        disabled={addComment.isPending || !name.trim() || !text.trim()}
        className="w-full"
      >
        {addComment.isPending ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin mr-2" />
            Posting...
          </>
        ) : (
          'Post Comment'
        )}
      </Button>
    </form>
  );
}
