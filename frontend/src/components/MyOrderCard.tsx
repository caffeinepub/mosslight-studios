import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tag, Truck } from 'lucide-react';
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
    const variant = product?.hasVariants && item.variantId && product.variants
      ? product.variants.find(v => v.id === item.variantId)
      : undefined;
    return { ...item, product, variant };
  });

  // Calculate totals including tax and shipping from product data
  const totals = orderItems.reduce((acc, item) => {
    const itemPrice = Number(item.price);
    const qty = Number(item.quantity);
    const taxRate = item.product?.taxRate ?? 8.5;
    const shippingPrice = item.product?.shippingPrice ?? 0;

    return {
      subtotal: acc.subtotal + itemPrice * qty,
      tax: acc.tax + itemPrice * (taxRate / 100) * qty,
      shipping: acc.shipping + shippingPrice * qty,
    };
  }, { subtotal: 0, tax: 0, shipping: 0 });

  const grandTotal = totals.subtotal + totals.tax + totals.shipping;

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
        <div className="space-y-3">
          {orderItems.map((item, index) => {
            const itemPrice = Number(item.price);
            const qty = Number(item.quantity);
            const taxRate = item.product?.taxRate ?? 8.5;
            const shippingPrice = item.product?.shippingPrice ?? 0;
            const lineSubtotal = itemPrice * qty;
            const lineTax = itemPrice * (taxRate / 100) * qty;
            const lineShipping = shippingPrice * qty;

            return (
              <div key={index} className="space-y-1.5">
                <div className="flex justify-between text-sm font-medium">
                  <span>
                    {item.product?.name || 'Unknown Product'} × {qty}
                  </span>
                  <span>${lineSubtotal.toFixed(2)}</span>
                </div>
                {item.variant && (
                  <div className="text-xs text-muted-foreground pl-2">
                    Size: {item.variant.size} • Color: {item.variant.color} • ${itemPrice.toFixed(2)} each
                  </div>
                )}
                <div className="flex justify-between text-xs text-muted-foreground pl-2">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Tax ({taxRate}%)
                  </span>
                  <span>+${lineTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pl-2">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    Shipping
                  </span>
                  <span>
                    {lineShipping > 0 ? `+$${lineShipping.toFixed(2)}` : 'Free'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <Separator />

        {/* Totals breakdown */}
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>${totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground items-center">
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              Tax
            </span>
            <span>+${totals.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground items-center">
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" />
              Shipping
            </span>
            <span>
              {totals.shipping > 0 ? `+$${totals.shipping.toFixed(2)}` : 'Free'}
            </span>
          </div>
          <Separator className="my-1" />
          <div className="flex justify-between font-bold text-primary">
            <span>Total</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
