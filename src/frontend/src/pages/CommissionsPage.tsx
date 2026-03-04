import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Palette,
  PlusCircle,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import type { Variants } from "motion/react";
import { useEffect } from "react";
import { useRecordAnalyticsEvent } from "../hooks/useAnalytics";
import { useGetCommissions } from "../hooks/useCommissions";

// Format bigint cents → "$X.XX"
function formatPrice(cents: bigint): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

export default function CommissionsPage() {
  const navigate = useNavigate();
  const { data: commissions = [], isLoading } = useGetCommissions();
  const recordAnalytics = useRecordAnalyticsEvent();

  const recordAnalyticsMutate = recordAnalytics.mutate;
  // Track page-view analytics on mount
  useEffect(() => {
    recordAnalyticsMutate({
      __kind__: "contentView",
      contentView: "commissions_page",
    });
  }, [recordAnalyticsMutate]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-primary py-20 px-4">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, oklch(var(--accent)) 0%, transparent 60%), radial-gradient(circle at 80% 20%, oklch(var(--primary-foreground)) 0%, transparent 50%)",
          }}
        />
        <div className="container relative z-10 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 text-primary-foreground/70">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium tracking-widest uppercase">
                Custom Work
              </span>
            </div>
            <h1 className="font-serif text-5xl font-bold text-primary-foreground leading-tight">
              Commission a Piece
            </h1>
            <p className="text-primary-foreground/80 text-lg max-w-xl">
              Request one-of-a-kind artwork tailored to your vision. Browse
              available commission types below and submit your request — limited
              spots open.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Commissions listing */}
      <section className="container py-16">
        {isLoading ? (
          <div
            className="flex flex-col items-center justify-center py-24 gap-4"
            data-ocid="commissions.loading_state"
          >
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading commissions…</p>
          </div>
        ) : commissions.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-24 gap-4 text-center"
            data-ocid="commissions.empty_state"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Palette className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-xl font-semibold">
                No commissions available right now
              </h3>
              <p className="text-muted-foreground max-w-sm">
                Check back soon — new commission slots open regularly.
              </p>
            </div>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {commissions.map((commission, idx) => {
              const isClosed = commission.openSpots === BigInt(0);
              const spotsLeft = Number(commission.openSpots);
              const totalSpots = Number(commission.totalSpots);

              return (
                <motion.div key={commission.id} variants={cardVariants}>
                  <Card
                    className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300"
                    data-ocid={`commissions.item.${idx + 1}`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="font-serif text-xl leading-tight">
                          {commission.title}
                        </CardTitle>
                        {isClosed ? (
                          <Badge variant="destructive" className="shrink-0">
                            Closed
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          >
                            Open
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {commission.description}
                      </p>
                    </CardHeader>

                    <CardContent className="flex-1 space-y-4">
                      {/* Pricing */}
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-primary font-serif">
                          {formatPrice(commission.basePrice)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          starting price
                        </span>
                      </div>

                      {/* Spots */}
                      <div className="flex items-center gap-2 text-sm">
                        {isClosed ? (
                          <Clock className="h-4 w-4 text-destructive" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        )}
                        <span
                          className={
                            isClosed ? "text-destructive" : "text-foreground"
                          }
                        >
                          {isClosed
                            ? "All spots filled"
                            : `${spotsLeft} of ${totalSpots} spots open`}
                        </span>
                      </div>

                      {/* Addons */}
                      {commission.addons.length > 0 && (
                        <>
                          <Separator />
                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Available Add-ons
                            </p>
                            <ul className="space-y-1">
                              {commission.addons.map((addon, addonIdx) => (
                                <li
                                  key={`${addon.name}-${addonIdx}`}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span className="flex items-center gap-1.5">
                                    <PlusCircle className="h-3 w-3 text-primary/60" />
                                    {addon.name}
                                  </span>
                                  <span className="text-primary font-medium">
                                    +{formatPrice(addon.price)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}
                    </CardContent>

                    <CardFooter className="pt-4">
                      <Button
                        className="w-full"
                        disabled={isClosed}
                        onClick={() =>
                          navigate({
                            to: "/commissions/$id",
                            params: { id: commission.id },
                          })
                        }
                        data-ocid={`commissions.primary_button.${idx + 1}`}
                      >
                        {isClosed
                          ? "Commission Closed"
                          : "Request This Commission"}
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </section>
    </div>
  );
}
