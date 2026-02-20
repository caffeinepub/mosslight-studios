import { useState } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useCreateDiscussionPost } from '../hooks/useDiscussionBoard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AskQuestionForm() {
  const [question, setQuestion] = useState('');
  const { identity } = useInternetIdentity();
  const createPost = useCreateDiscussionPost();

  const isAuthenticated = !!identity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please log in to ask a question');
      return;
    }

    try {
      await createPost.mutateAsync(question.trim());
      toast.success('Your question has been posted!');
      setQuestion('');
    } catch (error) {
      console.error('Error posting question:', error);
      toast.error('Failed to post question. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="question">Your Question</Label>
        <Textarea
          id="question"
          placeholder="What would you like to know about our products or services?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={4}
          className="resize-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={!isAuthenticated || createPost.isPending || !question.trim()}
          className="min-w-32"
        >
          {createPost.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Posting...
            </>
          ) : (
            'Post Question'
          )}
        </Button>
        {!isAuthenticated && (
          <p className="text-sm text-muted-foreground">
            Please log in to ask a question
          </p>
        )}
      </div>
    </form>
  );
}
