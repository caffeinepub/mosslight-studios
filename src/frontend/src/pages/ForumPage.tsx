import { useDiscussionPosts } from '../hooks/useDiscussionBoard';
import { Loader2, MessageSquarePlus } from 'lucide-react';
import DiscussionPostList from '../components/DiscussionPostList';
import AskQuestionForm from '../components/AskQuestionForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ForumPage() {
  const { data: posts = [], isLoading } = useDiscussionPosts();

  if (isLoading) {
    return (
      <div className="container py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl font-bold">Discussion Board</h1>
          <p className="text-muted-foreground text-lg">
            Ask questions and get answers from our team
          </p>
        </div>

        <Card className="border-primary/20 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5 text-primary" />
              Ask a Question
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AskQuestionForm />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="font-serif text-2xl font-semibold">Recent Questions</h2>
          {posts.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <p className="text-muted-foreground">
                No questions yet. Be the first to ask!
              </p>
            </div>
          ) : (
            <DiscussionPostList posts={posts} />
          )}
        </div>
      </div>
    </div>
  );
}
