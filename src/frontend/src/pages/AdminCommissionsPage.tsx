import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  DollarSign,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Trash2,
  User,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type Commission,
  type CommissionAddon,
  type CommissionRequest,
  CommissionRequestStatus,
} from "../backendTypes";
import AdminGuard from "../components/AdminGuard";
import {
  useAddCommission,
  useDeleteCommission,
  useGetCommissionRequests,
  useGetCommissions,
  useUpdateCommission,
  useUpdateCommissionRequestStatus,
} from "../hooks/useCommissions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(cents: bigint): string {
  return `$${(Number(cents) / 100).toFixed(2)}`;
}

function parseDollars(val: string): bigint {
  const n = Number.parseFloat(val);
  if (Number.isNaN(n) || n < 0) return BigInt(0);
  return BigInt(Math.round(n * 100));
}

function formatDate(ts: bigint): string {
  // ts is nanoseconds
  return new Date(Number(ts) / 1_000_000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type StatusKey = keyof typeof CommissionRequestStatus;

const STATUS_CONFIG: Record<StatusKey, { label: string; badgeClass: string }> =
  {
    pending: {
      label: "Pending",
      badgeClass:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
    },
    accepted: {
      label: "Accepted",
      badgeClass:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    },
    inProgress: {
      label: "In Progress",
      badgeClass:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    },
    completed: {
      label: "Completed",
      badgeClass:
        "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    },
    rejected: {
      label: "Rejected",
      badgeClass:
        "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    },
  };

// ─── Addon Manager ────────────────────────────────────────────────────────────

interface AddonManagerProps {
  addons: { name: string; price: string }[];
  onChange: (addons: { name: string; price: string }[]) => void;
}

function AddonManager({ addons, onChange }: AddonManagerProps) {
  const addAddon = () => onChange([...addons, { name: "", price: "" }]);

  const updateAddon = (idx: number, field: "name" | "price", value: string) => {
    const next = addons.map((a, i) =>
      i === idx ? { ...a, [field]: value } : a,
    );
    onChange(next);
  };

  const removeAddon = (idx: number) =>
    onChange(addons.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      {addons.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          No add-ons yet. Add optional extras customers can select.
        </p>
      )}
      {addons.map((addon, idx) => (
        <div
          key={addon.name || `addon-${idx}`}
          className="flex items-center gap-2"
        >
          <Input
            placeholder="Add-on name (e.g. Extra character)"
            value={addon.name}
            onChange={(e) => updateAddon(idx, "name", e.target.value)}
            className="flex-1 h-9 text-sm"
            data-ocid={`admin-commissions.input.${idx + 1}`}
          />
          <div className="relative w-28">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
              $
            </span>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={addon.price}
              onChange={(e) => updateAddon(idx, "price", e.target.value)}
              className="pl-5 h-9 text-sm"
              data-ocid={`admin-commissions.input.${idx + 1}`}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeAddon(idx)}
            className="h-9 w-9 p-0 text-destructive hover:text-destructive"
            data-ocid={`admin-commissions.delete_button.${idx + 1}`}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addAddon}
        className="w-full gap-2 text-xs"
        data-ocid="admin-commissions.secondary_button"
      >
        <Plus className="h-3.5 w-3.5" />
        Add Add-on
      </Button>
    </div>
  );
}

// ─── Commission Form ──────────────────────────────────────────────────────────

interface CommissionFormState {
  title: string;
  description: string;
  basePrice: string;
  totalSpots: string;
  addons: { name: string; price: string }[];
}

interface CommissionFormErrors {
  title?: string;
  description?: string;
  basePrice?: string;
  totalSpots?: string;
}

interface CommissionFormProps {
  initial?: Commission;
  onSuccess: () => void;
  onCancel: () => void;
}

function CommissionForm({ initial, onSuccess, onCancel }: CommissionFormProps) {
  const addCommission = useAddCommission();
  const updateCommission = useUpdateCommission();

  const [form, setForm] = useState<CommissionFormState>(() => ({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    basePrice: initial ? String(Number(initial.basePrice) / 100) : "",
    totalSpots: initial ? String(Number(initial.totalSpots)) : "",
    addons: initial
      ? initial.addons.map((a) => ({
          name: a.name,
          price: String(Number(a.price) / 100),
        }))
      : [],
  }));
  const [errors, setErrors] = useState<CommissionFormErrors>({});

  const isEditing = !!initial;

  const validate = (): boolean => {
    const e: CommissionFormErrors = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.basePrice || Number.parseFloat(form.basePrice) <= 0)
      e.basePrice = "Base price must be greater than 0";
    const spots = Number.parseInt(form.totalSpots, 10);
    if (!form.totalSpots || Number.isNaN(spots) || spots < 1)
      e.totalSpots = "Must have at least 1 spot";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const addons: CommissionAddon[] = form.addons
      .filter((a) => a.name.trim())
      .map((a) => ({ name: a.name.trim(), price: parseDollars(a.price) }));

    try {
      if (isEditing && initial) {
        await updateCommission.mutateAsync({
          commissionId: initial.id,
          title: form.title.trim(),
          description: form.description.trim(),
          basePrice: parseDollars(form.basePrice),
          totalSpots: BigInt(Number.parseInt(form.totalSpots, 10)),
          addons,
        });
        toast.success("Commission updated!");
      } else {
        await addCommission.mutateAsync({
          title: form.title.trim(),
          description: form.description.trim(),
          basePrice: parseDollars(form.basePrice),
          totalSpots: BigInt(Number.parseInt(form.totalSpots, 10)),
          addons,
        });
        toast.success("Commission created!");
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save commission");
    }
  };

  const isPending = addCommission.isPending || updateCommission.isPending;

  return (
    <Card data-ocid="admin-commissions.modal">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-xl">
          {isEditing ? "Edit Commission" : "New Commission"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <Label htmlFor="comm-title">
            Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="comm-title"
            placeholder="e.g. Digital Portrait, Sticker Design"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className={errors.title ? "border-destructive" : ""}
            data-ocid="admin-commissions.input"
          />
          {errors.title && (
            <p className="text-xs text-destructive">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="comm-description">
            Description <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="comm-description"
            placeholder="Describe what's included, your style, turnaround time, etc."
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className={`min-h-[100px] resize-y ${errors.description ? "border-destructive" : ""}`}
            data-ocid="admin-commissions.textarea"
          />
          {errors.description && (
            <p className="text-xs text-destructive">{errors.description}</p>
          )}
        </div>

        {/* Price + Spots */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="comm-price">
              Base Price (USD) <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                $
              </span>
              <Input
                id="comm-price"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={form.basePrice}
                onChange={(e) =>
                  setForm((f) => ({ ...f, basePrice: e.target.value }))
                }
                className={`pl-6 ${errors.basePrice ? "border-destructive" : ""}`}
                data-ocid="admin-commissions.input"
              />
            </div>
            {errors.basePrice && (
              <p className="text-xs text-destructive">{errors.basePrice}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="comm-spots">
              Total Spots <span className="text-destructive">*</span>
            </Label>
            <Input
              id="comm-spots"
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 5"
              value={form.totalSpots}
              onChange={(e) =>
                setForm((f) => ({ ...f, totalSpots: e.target.value }))
              }
              className={errors.totalSpots ? "border-destructive" : ""}
              data-ocid="admin-commissions.input"
            />
            {errors.totalSpots && (
              <p className="text-xs text-destructive">{errors.totalSpots}</p>
            )}
          </div>
        </div>

        {/* Addons */}
        <div className="space-y-2">
          <Label>Add-ons (optional)</Label>
          <AddonManager
            addons={form.addons}
            onChange={(addons) => setForm((f) => ({ ...f, addons }))}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            data-ocid="admin-commissions.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 gap-2"
            data-ocid="admin-commissions.save_button"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? "Update Commission" : "Create Commission"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Commission Card (Manage tab) ─────────────────────────────────────────────

interface CommissionCardProps {
  commission: Commission;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function CommissionCard({
  commission,
  index,
  onEdit,
  onDelete,
  isDeleting,
}: CommissionCardProps) {
  const isClosed = commission.openSpots === BigInt(0);

  return (
    <Card
      className="hover:shadow-md transition-shadow"
      data-ocid={`admin-commissions.item.${index}`}
    >
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-serif font-semibold text-lg leading-tight">
              {commission.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {commission.description}
            </p>
          </div>
          <Badge
            variant="secondary"
            className={
              isClosed
                ? "shrink-0 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                : "shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
            }
          >
            {isClosed ? "Closed" : "Open"}
          </Badge>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="font-semibold text-primary">
            {formatPrice(commission.basePrice)}
          </span>
          <span>
            {Number(commission.openSpots)}/{Number(commission.totalSpots)} spots
            open
          </span>
          {commission.addons.length > 0 && (
            <span>
              {commission.addons.length} add-on
              {commission.addons.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex-1 gap-1.5"
            data-ocid={`admin-commissions.edit_button.${index}`}
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={isDeleting}
            className="flex-1 gap-1.5"
            data-ocid={`admin-commissions.delete_button.${index}`}
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Request Row ──────────────────────────────────────────────────────────────

interface RequestRowProps {
  request: CommissionRequest;
  index: number;
}

function RequestRow({ request, index }: RequestRowProps) {
  const updateStatus = useUpdateCommissionRequestStatus();
  const [expanded, setExpanded] = useState(false);

  const statusKey = request.status as StatusKey;
  const cfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.pending;

  const handleStatusChange = async (newStatus: string) => {
    const statusValue = CommissionRequestStatus[newStatus as StatusKey];
    if (!statusValue) return;
    try {
      await updateStatus.mutateAsync({
        requestId: request.id,
        status: statusValue,
      });
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div
      className="border rounded-xl overflow-hidden"
      data-ocid={`admin-commissions.row.${index}`}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 p-4 bg-card">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">
              {request.name}
            </span>
            <span className="text-muted-foreground text-xs">→</span>
            <span className="text-sm text-primary font-medium truncate">
              {request.commissionTitle}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            <span>{formatDate(request.createdAt)}</span>
            <span className="font-semibold text-foreground/70">
              {formatPrice(request.totalPrice)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge className={`text-xs px-2 py-0.5 ${cfg.badgeClass}`}>
            {cfg.label}
          </Badge>

          <Select
            value={statusKey}
            onValueChange={handleStatusChange}
            disabled={updateStatus.isPending}
          >
            <SelectTrigger
              className="h-8 w-36 text-xs"
              data-ocid={`admin-commissions.select.${index}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_CONFIG) as StatusKey[]).map((key) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {STATUS_CONFIG[key].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((e) => !e)}
            className="h-8 w-8 p-0"
            data-ocid={`admin-commissions.toggle.${index}`}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t bg-muted/30 p-4 space-y-4">
              {/* Contact */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Contact
                </p>
                <div className="flex flex-wrap gap-3 text-sm">
                  {request.discordUsername && (
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-indigo-500" />
                      <span className="font-medium">Discord:</span>{" "}
                      {request.discordUsername}
                    </span>
                  )}
                  {request.phoneNumber && (
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="font-medium">Phone:</span>{" "}
                      {request.phoneNumber}
                    </span>
                  )}
                  {request.email && (
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                      <span className="font-medium">Email:</span>{" "}
                      {request.email}
                    </span>
                  )}
                  {!request.discordUsername &&
                    !request.phoneNumber &&
                    !request.email && (
                      <span className="text-muted-foreground italic text-xs">
                        No contact info provided
                      </span>
                    )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Request Description
                </p>
                <p className="text-sm leading-relaxed">{request.description}</p>
              </div>

              {/* Addons */}
              {request.selectedAddons.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Selected Add-ons
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {request.selectedAddons.map((addon, i) => (
                      <span
                        key={`${addon.name}-${i}`}
                        className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary rounded-full px-3 py-1"
                      >
                        <DollarSign className="h-3 w-3" />
                        {addon.name} (+{formatPrice(addon.price)})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reference images */}
              {request.referenceImages.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Reference Images ({request.referenceImages.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {request.referenceImages.map((img, i) => {
                      const url = img.getDirectURL();
                      const stableKey = url || `${request.id}-ref-${i}`;
                      return url ? (
                        <a
                          key={stableKey}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-20 h-20 rounded-lg overflow-hidden border hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={url}
                            alt={`Reference ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      ) : (
                        <div
                          key={stableKey}
                          className="w-20 h-20 rounded-lg border bg-muted flex items-center justify-center"
                        >
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Separator />
              <div className="flex justify-end">
                <span className="text-sm font-bold">
                  Total:{" "}
                  <span className="text-primary">
                    {formatPrice(request.totalPrice)}
                  </span>
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminCommissionsPage() {
  const { data: commissions = [], isLoading: commissionsLoading } =
    useGetCommissions();
  const { data: requests = [], isLoading: requestsLoading } =
    useGetCommissionRequests();
  const deleteCommission = useDeleteCommission();

  const [showForm, setShowForm] = useState(false);
  const [editingCommission, setEditingCommission] = useState<
    Commission | undefined
  >(undefined);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleEdit = (commission: Commission) => {
    setEditingCommission(commission);
    setShowForm(true);
  };

  const handleDelete = async (commissionId: string) => {
    if (!confirm("Are you sure you want to delete this commission?")) return;
    setDeletingId(commissionId);
    try {
      await deleteCommission.mutateAsync(commissionId);
      toast.success("Commission deleted");
    } catch {
      toast.error("Failed to delete commission");
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCommission(undefined);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCommission(undefined);
  };

  return (
    <AdminGuard>
      <div className="container py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="font-serif text-4xl font-bold">
              Commission Management
            </h1>
            <p className="text-muted-foreground">
              Create and manage commission types, review and respond to requests
            </p>
          </div>

          <Tabs defaultValue="manage" data-ocid="admin-commissions.tab">
            <TabsList className="mb-6">
              <TabsTrigger value="manage" data-ocid="admin-commissions.tab">
                Manage Commissions
              </TabsTrigger>
              <TabsTrigger value="requests" data-ocid="admin-commissions.tab">
                Commission Requests
                {requests.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 px-1.5 text-xs"
                  >
                    {requests.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* ─── Manage tab ────────────────────────────────────────── */}
            <TabsContent value="manage">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {commissions.length} commission
                    {commissions.length !== 1 ? "s" : ""}
                  </p>
                  {!showForm && (
                    <Button
                      onClick={() => {
                        setEditingCommission(undefined);
                        setShowForm(true);
                      }}
                      className="gap-2"
                      data-ocid="admin-commissions.open_modal_button"
                    >
                      <Plus className="h-4 w-4" />
                      Add Commission
                    </Button>
                  )}
                </div>

                {/* Inline form */}
                <AnimatePresence>
                  {showForm && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CommissionForm
                        initial={editingCommission}
                        onSuccess={handleFormSuccess}
                        onCancel={handleFormCancel}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {commissionsLoading ? (
                  <div
                    className="flex justify-center py-16"
                    data-ocid="admin-commissions.loading_state"
                  >
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : commissions.length === 0 ? (
                  <div
                    className="text-center py-16 space-y-3"
                    data-ocid="admin-commissions.empty_state"
                  >
                    <p className="text-muted-foreground">
                      No commissions yet. Click "Add Commission" to create your
                      first one.
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {commissions.map((commission, idx) => (
                      <CommissionCard
                        key={commission.id}
                        commission={commission}
                        index={idx + 1}
                        onEdit={() => handleEdit(commission)}
                        onDelete={() => handleDelete(commission.id)}
                        isDeleting={deletingId === commission.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ─── Requests tab ─────────────────────────────────────── */}
            <TabsContent value="requests">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {requests.length} total request
                    {requests.length !== 1 ? "s" : ""}
                  </p>
                </div>

                {requestsLoading ? (
                  <div
                    className="flex justify-center py-16"
                    data-ocid="admin-commissions.loading_state"
                  >
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : requests.length === 0 ? (
                  <div
                    className="text-center py-16 space-y-3"
                    data-ocid="admin-commissions.empty_state"
                  >
                    <p className="text-muted-foreground">
                      No commission requests yet. They'll appear here when
                      customers submit them.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3" data-ocid="admin-commissions.list">
                    {requests.map((request, idx) => (
                      <RequestRow
                        key={request.id}
                        request={request}
                        index={idx + 1}
                      />
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminGuard>
  );
}
