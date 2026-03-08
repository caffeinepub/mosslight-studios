import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  ImageIcon,
  Loader2,
  PlusCircle,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { type ChangeEvent, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type { CommissionAddon } from "../backendTypes";
import { useGetCommission } from "../hooks/useCommissions";
import { useSubmitCommissionRequest } from "../hooks/useCommissions";

// Format bigint cents → "$X.XX"
function formatPrice(cents: bigint): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

interface FormState {
  name: string;
  discord: string;
  phone: string;
  email: string;
  description: string;
}

interface FormErrors {
  name?: string;
  contact?: string;
  description?: string;
}

interface ImagePreview {
  file: File;
  dataUrl: string;
}

const MAX_IMAGES = 5;

export default function CommissionDetailPage() {
  const { id } = useParams({ from: "/commissions/$id" });
  const navigate = useNavigate();
  const { data: commission, isLoading } = useGetCommission(id);
  const submitRequest = useSubmitCommissionRequest();

  // Form state
  const [form, setForm] = useState<FormState>({
    name: "",
    discord: "",
    phone: "",
    email: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [selectedAddons, setSelectedAddons] = useState<Set<number>>(new Set());
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleField =
    (field: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (formErrors[field as keyof FormErrors]) {
        setFormErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  const toggleAddon = (idx: number) => {
    setSelectedAddons((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const handleImageFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = MAX_IMAGES - imagePreviews.length;
    const allowed = Array.from(files).slice(0, remaining);

    const readers = allowed.map(
      (file) =>
        new Promise<ImagePreview>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) =>
            resolve({ file, dataUrl: e.target?.result as string });
          reader.readAsDataURL(file);
        }),
    );

    Promise.all(readers).then((previews) => {
      setImagePreviews((prev) => [...prev, ...previews].slice(0, MAX_IMAGES));
    });
  };

  const removeImage = (idx: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const validate = (): boolean => {
    const errors: FormErrors = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.discord.trim() && !form.phone.trim() && !form.email.trim()) {
      errors.contact =
        "Please provide at least one contact method (Discord, phone, or email)";
    }
    if (!form.description.trim())
      errors.description = "Please describe what you want";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!commission) return;
    if (!validate()) return;

    // Convert image files to ExternalBlob
    const imageBlobs = await Promise.all(
      imagePreviews.map(async ({ file }) => {
        const buffer = await file.arrayBuffer();
        return ExternalBlob.fromBytes(new Uint8Array(buffer));
      }),
    );

    const addons: CommissionAddon[] = commission.addons
      .filter((_, idx) => selectedAddons.has(idx))
      .map((a) => ({ name: a.name, price: a.price }));

    try {
      await submitRequest.mutateAsync({
        commissionId: commission.id,
        name: form.name.trim(),
        discordUsername: form.discord.trim() || null,
        phoneNumber: form.phone.trim() || null,
        email: form.email.trim() || null,
        description: form.description.trim(),
        selectedAddons: addons,
        referenceImages: imageBlobs,
      });
      setSubmitted(true);
      toast.success("Commission request submitted!");
    } catch (err: any) {
      toast.error(
        err?.message || "Failed to submit request. Please try again.",
      );
    }
  };

  // Calculate running total
  const totalPrice = commission
    ? commission.addons.reduce((sum, addon, idx) => {
        return sum + (selectedAddons.has(idx) ? addon.price : BigInt(0));
      }, commission.basePrice)
    : BigInt(0);

  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
        data-ocid="commission-detail.loading_state"
      >
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading commission…</p>
      </div>
    );
  }

  if (!commission) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center container"
        data-ocid="commission-detail.error_state"
      >
        <h2 className="font-serif text-2xl font-bold">Commission Not Found</h2>
        <p className="text-muted-foreground">
          This commission may no longer be available.
        </p>
        <Button asChild variant="outline">
          <Link to="/commissions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Commissions
          </Link>
        </Button>
      </div>
    );
  }

  const isClosed = commission.openSpots === BigInt(0);

  // ─── Success screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="container py-20 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6"
          data-ocid="commission-detail.success_state"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-4xl font-bold">
              Request Submitted!
            </h1>
            <p className="text-muted-foreground text-lg">
              Thank you for your interest in a{" "}
              <strong>{commission.title}</strong>. I'll review your request and
              reach out via your preferred contact method.
            </p>
          </div>
          <div className="bg-muted/50 rounded-xl p-6 text-left space-y-3">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Your request summary
            </p>
            <div className="space-y-1">
              <p className="text-sm">
                <span className="font-medium">Name:</span> {form.name}
              </p>
              {form.discord && (
                <p className="text-sm">
                  <span className="font-medium">Discord:</span> {form.discord}
                </p>
              )}
              {form.phone && (
                <p className="text-sm">
                  <span className="font-medium">Phone:</span> {form.phone}
                </p>
              )}
              {form.email && (
                <p className="text-sm">
                  <span className="font-medium">Email:</span> {form.email}
                </p>
              )}
              <p className="text-sm">
                <span className="font-medium">Total:</span>{" "}
                <span className="text-primary font-bold">
                  {formatPrice(totalPrice)}
                </span>
              </p>
            </div>
          </div>
          <Button
            onClick={() => navigate({ to: "/commissions" })}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Commissions
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-4xl mx-auto">
      {/* Back nav */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ to: "/commissions" })}
        className="mb-8 gap-2 text-muted-foreground hover:text-foreground"
        data-ocid="commission-detail.link"
      >
        <ArrowLeft className="h-4 w-4" />
        All Commissions
      </Button>

      <div className="grid lg:grid-cols-[1fr_360px] gap-10">
        {/* ─── Left: Commission details ─────────────────────────────────── */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-primary/60" />
                  <span className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
                    Commission
                  </span>
                </div>
                <h1 className="font-serif text-4xl font-bold leading-tight">
                  {commission.title}
                </h1>
              </div>
              {isClosed ? (
                <Badge variant="destructive" className="mt-2 shrink-0">
                  Closed
                </Badge>
              ) : (
                <Badge
                  variant="secondary"
                  className="mt-2 shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                >
                  {Number(commission.openSpots)} spot
                  {Number(commission.openSpots) !== 1 ? "s" : ""} open
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-base leading-relaxed">
              {commission.description}
            </p>
          </div>

          {/* Base price */}
          <div className="flex items-center gap-3 py-4 border-y">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Starting at
              </p>
              <p className="text-3xl font-bold font-serif text-primary">
                {formatPrice(commission.basePrice)}
              </p>
            </div>
          </div>

          {/* Add-ons */}
          {commission.addons.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-serif text-lg font-semibold">
                Available Add-ons
              </h3>
              <div className="space-y-2">
                {commission.addons.map((addon, idx) => (
                  <label
                    key={`${addon.name}-${idx}`}
                    htmlFor={`addon-${idx}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`addon-${idx}`}
                        checked={selectedAddons.has(idx)}
                        onCheckedChange={() => toggleAddon(idx)}
                        disabled={isClosed}
                        data-ocid={`commission-detail.checkbox.${idx + 1}`}
                      />
                      <div>
                        <p className="text-sm font-medium">{addon.name}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-primary shrink-0">
                      <PlusCircle className="h-3 w-3 inline mr-1 text-primary/60" />
                      {formatPrice(addon.price)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── Right: Request form ──────────────────────────────────────── */}
        {isClosed ? (
          <Card className="h-fit">
            <CardContent className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <X className="h-5 w-5 text-destructive" />
              </div>
              <h3 className="font-serif text-lg font-semibold">
                Commission Closed
              </h3>
              <p className="text-sm text-muted-foreground">
                All spots for this commission are currently filled. Check back
                later or browse other available commissions.
              </p>
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link to="/commissions">View Other Commissions</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-fit" data-ocid="commission-detail.panel">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-xl">
                Submit Your Request
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="req-name">
                  Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="req-name"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={handleField("name")}
                  className={formErrors.name ? "border-destructive" : ""}
                  data-ocid="commission-detail.input"
                />
                {formErrors.name && (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="commission-detail.error_state"
                  >
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Contact section */}
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  <Label>Contact Info</Label>
                  <span className="text-xs text-muted-foreground ml-1">
                    (at least one required)
                  </span>
                </div>
                {formErrors.contact && (
                  <p
                    className="text-xs text-destructive"
                    data-ocid="commission-detail.error_state"
                  >
                    {formErrors.contact}
                  </p>
                )}
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                      Discord
                    </span>
                    <Input
                      id="req-discord"
                      placeholder="username#0000"
                      value={form.discord}
                      onChange={handleField("discord")}
                      className="pl-16"
                      data-ocid="commission-detail.input"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                      Phone
                    </span>
                    <Input
                      id="req-phone"
                      placeholder="+1 (555) 000-0000"
                      value={form.phone}
                      onChange={handleField("phone")}
                      className="pl-14"
                      type="tel"
                      data-ocid="commission-detail.input"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                      Email
                    </span>
                    <Input
                      id="req-email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleField("email")}
                      className="pl-12"
                      type="email"
                      data-ocid="commission-detail.input"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="req-description">
                  Describe what you want{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="req-description"
                  placeholder="Tell me about your idea — style, subject, colors, mood, any specific details…"
                  value={form.description}
                  onChange={handleField("description")}
                  className={`min-h-[120px] resize-y ${formErrors.description ? "border-destructive" : ""}`}
                  data-ocid="commission-detail.textarea"
                />
                {formErrors.description && (
                  <p className="text-xs text-destructive">
                    {formErrors.description}
                  </p>
                )}
              </div>

              {/* Reference images */}
              <div className="space-y-2">
                <Label>
                  Reference Images{" "}
                  <span className="text-xs text-muted-foreground font-normal">
                    (up to {MAX_IMAGES})
                  </span>
                </Label>

                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    <AnimatePresence>
                      {imagePreviews.map((preview, idx) => (
                        <motion.div
                          key={preview.dataUrl.slice(-20)}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.85 }}
                          className="relative group aspect-square rounded-lg overflow-hidden border"
                        >
                          <img
                            src={preview.dataUrl}
                            alt={`Reference ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}

                {imagePreviews.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center gap-2 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
                    data-ocid="commission-detail.upload_button"
                  >
                    <ImageIcon className="h-6 w-6" />
                    <span>Click to upload reference images</span>
                    <span className="text-xs">
                      {MAX_IMAGES - imagePreviews.length} slot
                      {MAX_IMAGES - imagePreviews.length !== 1 ? "s" : ""}{" "}
                      remaining
                    </span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageFiles(e.target.files)}
                  data-ocid="commission-detail.dropzone"
                />
              </div>

              <Separator />

              {/* Running total */}
              <div className="bg-muted/40 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Base price</span>
                  <span>{formatPrice(commission.basePrice)}</span>
                </div>
                {commission.addons
                  .filter((_, idx) => selectedAddons.has(idx))
                  .map((addon, displayIdx) => (
                    <div
                      key={`selected-${addon.name}-${displayIdx}`}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        + {addon.name}
                      </span>
                      <span>{formatPrice(addon.price)}</span>
                    </div>
                  ))}
                <Separator />
                <div className="flex items-center justify-between font-bold">
                  <span>Estimated Total</span>
                  <span className="text-primary text-lg">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>

              {/* Submit */}
              <Button
                className="w-full gap-2"
                onClick={handleSubmit}
                disabled={submitRequest.isPending}
                data-ocid="commission-detail.submit_button"
              >
                {submitRequest.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Submit Request
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
