import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { CheckCircle, ClipboardList } from "lucide-react";

const SURVEY_URL = "https://forms.gle/iHpYScSV2sfthoPb8";

export default function OrderSuccessPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/order-success" }) as { orderId?: string };

  return (
    <div className="container py-20">
      <Card className="max-w-md mx-auto text-center">
        <CardContent className="pt-12 pb-8 space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-6">
              <CheckCircle className="h-16 w-16 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-bold">Order Confirmed!</h1>
            <p className="text-muted-foreground">
              Thank you for your purchase. Your order has been successfully
              placed.
            </p>
            {search.orderId && (
              <p className="text-sm text-muted-foreground pt-2">
                Order ID: <span className="font-mono">{search.orderId}</span>
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <Button onClick={() => navigate({ to: "/my-orders" })}>
              View My Orders
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate({ to: "/products" })}
            >
              Continue Shopping
            </Button>
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">
              How was your experience? We&apos;d love to hear from you!
            </p>
            <a
              href={SURVEY_URL}
              target="_blank"
              rel="noopener noreferrer"
              data-ocid="order_success.survey_button"
            >
              <Button
                variant="ghost"
                className="gap-2 text-primary hover:text-primary hover:bg-primary/10"
              >
                <ClipboardList className="h-4 w-4" />
                Share Your Feedback
              </Button>
            </a>
            <p className="text-xs text-muted-foreground/60 mt-2">
              Optional &middot; Takes less than a minute
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
