import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import type { Reply } from '../backend';

interface ReplyListProps {
  replies: Reply[];
}

export default function ReplyList({ replies }: ReplyListProps) {
  const sortedReplies = [...replies].sort((a, b) => 
    Number(a.timestamp) - Number(b.timestamp)
  );

  return (
    <div className="space-y-4">
      {sortedReplies.map((reply, index) => {
        const timestamp = new Date(Number(reply.timestamp) / 1000000);
        const isAdmin = true; // All replies are from admins based on backend logic

        return (
          <Card 
            key={index} 
            className={isAdmin ? 'border-primary/30 bg-primary/5' : ''}
          >
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Badge className="bg-primary text-primary-foreground hover:bg-primary">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {timestamp.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {reply.content}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
