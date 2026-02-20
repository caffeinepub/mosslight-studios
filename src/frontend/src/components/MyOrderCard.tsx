import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import OrderStatusBadge from './OrderStatusBadge';
import { useGetProducts } from '../hooks/useProducts';
import type { Order, ProductVariant } from '../backend';

interface MyOrderCardProps {
  order: Order;
}

export default function MyOrderCard({ order }: MyOrderCardProps) {
  const { data: products = [] } = useGetProducts();

  const orderDate = new Date(Number(order.date) / 1000000).toLocaleDateString();

  const orderItems = order.items.map(item => {
    const product = products.find(p => p.id === item.productId);
    let variant: ProductVariant | undefined = undefined;
    if (product?.hasVariants && item.variantId && product.variants) {
      variant = product.variants.find(v => v.id === item.variantId);
    }
    return { ...item, product, variant };
  });

  const total = orderItems.reduce((sum, item) => {
    if (!item.product) return sum;
    const itemPrice = item.variant ? Number(item.variant.price) : Number(item.product.price);
    return sum + (itemPrice * Number(item.quantity));
  }, 0);

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
            const itemPrice = item.variant ? Number(item.variant.price) : (item.product ? Number(item.product.price) : 0);
            const lineTotal = itemPrice * Number(item.quantity);
            
            return (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>
                    {item.product?.name || 'Unknown Product'} × {Number(item.quantity)}
                  </span>
                  <span className="font-medium">
                    ${(lineTotal / 100).toFixed(2)}
                  </span>
                </div>
                {item.variant && (
                  <div className="text-xs text-muted-foreground pl-2">
                    Size: {item.variant.size} • Color: {item.variant.color} • ${(Number(item.variant.price) / 100).toFixed(2)} each
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between pt-2 border-t font-semibold">
          <span>Total</span>
          <span className="text-primary">${(total / 100).toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
