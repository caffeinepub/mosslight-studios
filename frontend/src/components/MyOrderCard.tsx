import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import OrderStatusBadge from './OrderStatusBadge';
import { useGetProducts } from '../hooks/useProducts';
import type { Order } from '../backend';

interface MyOrderCardProps {
  order: Order;
}

export default function MyOrderCard({ order }: MyOrderCardProps) {
  const { data: products = [] } = useGetProducts();

  const orderDate = new Date(Number(order.date) / 1000000).toLocaleDateString();

  const orderItems = order.items.map(item => {
    const product = products.find(p => p.id === item.productId);
    // Find variant info for display purposes (size/color labels)
    const variant = product?.hasVariants && item.variantId && product.variants
      ? product.variants.find(v => v.id === item.variantId)
      : undefined;
    return { ...item, product, variant };
  });

  // Use order.total from the backend (authoritative, stored in USD dollars)
  const total = Number(order.total);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="font-serif">Order {order.id}</CardTitle>
            <p className="text-sm text-muted-foreground">{orderDate}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {orderItems.map((item, index) => {
            // Use item.price directly — stored in USD dollars at time of order
            const itemPrice = Number(item.price);
            const lineTotal = itemPrice * Number(item.quantity);

            return (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>
                    {item.product?.name || 'Unknown Product'} × {Number(item.quantity)}
                  </span>
                  <span className="font-medium">
                    ${lineTotal.toFixed(2)}
                  </span>
                </div>
                {item.variant && (
                  <div className="text-xs text-muted-foreground pl-2">
                    Size: {item.variant.size} • Color: {item.variant.color} • ${itemPrice.toFixed(2)} each
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between pt-2 border-t font-semibold">
          <span>Total</span>
          <span className="text-primary">${total.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
