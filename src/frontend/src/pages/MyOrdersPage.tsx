import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useUserProfile';
import { useGetMyOrders } from '../hooks/useCustomerOrders';
import { useGetMyMessages } from '../hooks/useCustomerMessages';
import { Loader2 } from 'lucide-react';
import MyOrderCard from '../components/MyOrderCard';
import CustomerMessagesPanel from '../components/CustomerMessagesPanel';
import ProfileSetupModal from '../components/ProfileSetupModal';
import AccessDeniedScreen from '../components/AccessDeniedScreen';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MyOrdersPage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const { data: orders = [], isLoading: ordersLoading } = useGetMyOrders();
  const { data: messages = [] } = useGetMyMessages();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (!isAuthenticated) {
    return <AccessDeniedScreen />;
  }

  if (profileLoading || !isFetched) {
    return (
      <div className="container py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <ProfileSetupModal open={showProfileSetup} />
      
      <div className="container py-12">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="font-serif text-4xl font-bold">My Account</h1>
            <p className="text-muted-foreground">
              Welcome back, {userProfile?.name}
            </p>
          </div>

          <Tabs defaultValue="orders" className="w-full">
            <TabsList>
              <TabsTrigger value="orders">My Orders</TabsTrigger>
              <TabsTrigger value="messages">
                Messages {messages.length > 0 && `(${messages.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="space-y-6 mt-6">
              {ordersLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    You haven't placed any orders yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <MyOrderCard key={order.id} order={order} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="messages" className="mt-6">
              <CustomerMessagesPanel messages={messages} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

