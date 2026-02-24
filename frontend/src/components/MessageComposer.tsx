import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Send } from 'lucide-react';
import { useSendMessage } from '../hooks/useMessages';
import { toast } from 'sonner';

export default function MessageComposer() {
  const [content, setContent] = useState('');
  const [recipientType, setRecipientType] = useState<'all' | 'specific'>('all');
  const sendMessage = useSendMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      await sendMessage.mutateAsync({
        content: content.trim(),
        recipient: recipientType === 'all' ? null : null, // For now, only broadcast messages
      });
      toast.success('Message sent successfully');
      setContent('');
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif">Compose Message</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Recipients</Label>
            <RadioGroup value={recipientType} onValueChange={(value) => setRecipientType(value as 'all' | 'specific')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="font-normal cursor-pointer">
                  All Customers (Broadcast)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter your message..."
              rows={6}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={sendMessage.isPending} className="gap-2">
            {sendMessage.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Message
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

