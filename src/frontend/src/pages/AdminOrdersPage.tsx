import { useGetCallerUserRole } from '../hooks/useUserProfile';
import { useGetOrders } from '../hooks/useOrders';
import { Loader2 } from 'lucide-react';
import OrderList from '../components/OrderList';
import AccessDeniedScreen from '../components/AccessDeniedScreen';

export default function AdminOrdersPage() {
  const { data: userRole, isLoading: roleLoading } = useGetCallerUserRole();
  const { data: orders = [], isLoading: ordersLoading } = useGetOrders();

  const isAdmin = userRole === 'admin';

  if (roleLoading) {
    return (
      <div className="container py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <AccessDeniedScreen />;
  }

  return (
    <div className="container py-12">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl font-bold">Manage Orders</h1>
          <p className="text-muted-foreground">
            View and manage customer orders
          </p>
        </div>

        {ordersLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <OrderList orders={orders} />
        )}
      </div>
    </div>
  );
}

