import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Message } from '../backend';

interface MessageHistoryProps {
  messages: Message[];
}

export default function MessageHistory({ messages }: MessageHistoryProps) {
  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No messages sent yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const timestamp = new Date(Number(message.timestamp) / 1000000).toLocaleString();
        const isBroadcast = !message.recipient;

        return (
          <Card key={message.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <CardTitle className="font-serif text-lg">Message {message.id}</CardTitle>
                <Badge variant={isBroadcast ? 'default' : 'secondary'}>
                  {isBroadcast ? 'Broadcast' : 'Direct'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{timestamp}</p>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.recipient && (
                <p className="text-sm text-muted-foreground mt-2">
                  To: {message.recipient.toString().slice(0, 20)}...
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

