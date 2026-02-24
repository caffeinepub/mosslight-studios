import AdminGuard from '../components/AdminGuard';
import { useGetAnalyticsData } from '../hooks/useAnalytics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, DollarSign, ShoppingBag, MousePointer, Eye, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useGetAnalyticsData();

  if (isLoading) {
    return (
      <AdminGuard>
        <div className="container py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminGuard>
    );
  }

  const {
    mostClickedProducts = [],
    mostViewedContent = [],
    totalRevenue = BigInt(0),
    orderCount = BigInt(0),
    lowInventoryProducts = [],
  } = data || {};

  const formatCurrency = (cents: bigint) => {
    return `$${(Number(cents) / 100).toFixed(2)}`;
  };

  return (
    <AdminGuard>
      <div className="container py-12">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="font-serif text-4xl font-bold">Analytics Dashboard</h1>
            <p className="text-muted-foreground">
              Track performance metrics and business insights
            </p>
          </div>

          {/* Metrics Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(totalRevenue)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Total Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Number(orderCount)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MousePointer className="h-4 w-4" />
                  Product Clicks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {mostClickedProducts.reduce((sum, [_, count]) => sum + Number(count), 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Content Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {mostViewedContent.reduce((sum, [_, count]) => sum + Number(count), 0)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Low Inventory Alert */}
          {lowInventoryProducts.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Low Inventory Alert</p>
                  <p className="text-sm">
                    {lowInventoryProducts.length} product{lowInventoryProducts.length !== 1 ? 's' : ''} running low on stock
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {lowInventoryProducts.map((product) => (
                      <Badge key={product.id} variant="outline" className="bg-background">
                        {product.name} ({Number(product.inventory)} left)
                      </Badge>
                    ))}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Top Clicked Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="h-5 w-5" />
                Top Clicked Products
              </CardTitle>
              <CardDescription>Most popular products by click count</CardDescription>
            </CardHeader>
            <CardContent>
              {mostClickedProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No product click data yet
                </p>
              ) : (
                <div className="space-y-3">
                  {mostClickedProducts.slice(0, 10).map(([productId, count], index) => (
                    <div key={productId} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-muted-foreground w-6">
                          #{index + 1}
                        </span>
                        <span className="text-sm font-medium">{productId}</span>
                      </div>
                      <Badge variant="secondary">{Number(count)} clicks</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Most Viewed Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Most Viewed Gallery Content
              </CardTitle>
              <CardDescription>Top performing content by view count</CardDescription>
            </CardHeader>
            <CardContent>
              {mostViewedContent.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No content view data yet
                </p>
              ) : (
                <div className="space-y-3">
                  {mostViewedContent.slice(0, 10).map(([contentId, count], index) => (
                    <div key={contentId} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-muted-foreground w-6">
                          #{index + 1}
                        </span>
                        <span className="text-sm font-medium">{contentId}</span>
                      </div>
                      <Badge variant="secondary">{Number(count)} views</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminGuard>
  );
}
