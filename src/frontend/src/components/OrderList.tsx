import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useUpdateOrderStatus } from '../hooks/useOrders';
import { useGetProducts } from '../hooks/useProducts';
import OrderStatusBadge from './OrderStatusBadge';
import { toast } from 'sonner';
import type { Order, OrderStatus } from '../backend';

interface OrderListProps {
  orders: Order[];
}

export default function OrderList({ orders }: OrderListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const updateStatus = useUpdateOrderStatus();
  const { data: products = [] } = useGetProducts();

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({
        orderId,
        status: newStatus as OrderStatus,
      });
      toast.success('Order status updated');
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No orders yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search by order ID or customer..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-md"
      />

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No orders match your search.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const orderDate = new Date(Number(order.date) / 1000000).toLocaleDateString();
            const orderItems = order.items.map(item => {
              const product = products.find(p => p.id === item.productId);
              return { ...item, product };
            });
            const total = orderItems.reduce((sum, item) => {
              if (!item.product) return sum;
              return sum + (Number(item.product.price) * Number(item.quantity));
            }, 0);

            return (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="font-serif">Order {order.id}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Customer: {order.customer.toString().slice(0, 20)}...
                      </p>
                      <p className="text-sm text-muted-foreground">{orderDate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <OrderStatusBadge status={order.status} />
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {orderItems.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.product?.name || 'Unknown Product'} × {Number(item.quantity)}
                        </span>
                        {item.product && (
                          <span className="font-medium">
                            ${((Number(item.product.price) * Number(item.quantity)) / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between pt-2 border-t font-semibold">
                    <span>Total</span>
                    <span className="text-primary">${(total / 100).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

