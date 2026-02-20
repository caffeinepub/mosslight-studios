import { useGetMessages } from '../hooks/useMessages';
import { Loader2 } from 'lucide-react';
import MessageComposer from '../components/MessageComposer';
import MessageHistory from '../components/MessageHistory';
import AdminGuard from '../components/AdminGuard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminMessagesPage() {
  const { data: messages = [], isLoading: messagesLoading } = useGetMessages();

  return (
    <AdminGuard>
      <div className="container py-12">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="font-serif text-4xl font-bold">Messages</h1>
            <p className="text-muted-foreground">
              Send messages to customers
            </p>
          </div>

          <Tabs defaultValue="compose" className="w-full">
            <TabsList>
              <TabsTrigger value="compose">Compose Message</TabsTrigger>
              <TabsTrigger value="history">Message History</TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="mt-6">
              <MessageComposer />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              {messagesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <MessageHistory messages={messages} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminGuard>
  );
}
