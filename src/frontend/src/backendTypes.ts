/**
 * backendTypes.ts
 *
 * Re-declares all legacy types that were removed from backend.d.ts when the
 * backend was regenerated for the Creator Dashboard feature.
 *
 * backend.d.ts is write-protected, so these types live here instead.
 * Import them from "../backendTypes" (or the correct relative path).
 */

import type { Principal } from "@icp-sdk/core/principal";
import type { Time } from "./backend.d";

// ExternalBlob is a runtime class exported from backend.ts — import it as a
// value from "../backend" in files that need it. The type alias here is for
// files that only need the shape for type-checking parameters.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExternalBlob = any;

// ─── Products ─────────────────────────────────────────────────────────────────

export type ProductColor = { name: string; inventory: bigint };

export type ProductVariant = {
  id: string;
  size: string;
  colors: ProductColor[];
  price: bigint;
  parentProductId: string;
  sku?: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  price: bigint;
  images: ExternalBlob[];
  inventory: bigint;
  variants: ProductVariant[] | null;
  hasVariants: boolean;
  sku: string;
  categories: string[];
  colors: string[];
  sizes: string[];
  taxRate: number;
  shippingPrice: number;
};

export type CreateProductData = {
  name: string;
  description: string;
  price: bigint;
  inventory: bigint;
  hasVariants: boolean;
  variants: ProductVariant[] | null;
  sku: string;
  categories: string[];
  colors: string[];
  sizes: string[];
  taxRate: number;
  shippingPrice: number;
};

export type ExternalProduct = { id: string; images: ExternalBlob[] };

// ─── Orders ───────────────────────────────────────────────────────────────────

export type Customer = Principal;

export type OrderStatus = "pending" | "shipped" | "delivered";

export type OrderItem = {
  productId: string;
  variantId: string | null;
  color: string;
  quantity: bigint;
  price: bigint;
};

export type Order = {
  id: string;
  customer: Customer;
  items: OrderItem[];
  total: bigint;
  status: OrderStatus;
  date: Time;
};

// ─── Messages ─────────────────────────────────────────────────────────────────

export type Message = {
  id: string;
  content: string;
  recipient: Principal | null;
  timestamp: Time;
};

// ─── Social / Gallery ─────────────────────────────────────────────────────────

export type SocialMediaContent = {
  id: string;
  content: string;
  media: ExternalBlob[];
  timestamp: Time;
};

// ─── Discussion Board ─────────────────────────────────────────────────────────

export type PostStatus = "open" | "answered";

export type Reply = {
  author: Principal;
  content: string;
  timestamp: Time;
};

export type DiscussionPost = {
  id: string;
  question: string;
  author: Principal;
  timestamp: Time;
  status: PostStatus;
  replies: Reply[];
};

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | { __kind__: "orderUpdate"; value: string }
  | { __kind__: "adminAlert" }
  | { __kind__: "lowInventory"; value: string };

export type Notification = {
  id: string;
  recipient: Principal;
  notifType: NotificationType;
  message: string;
  timestamp: Time;
  read: boolean;
  relatedOrderId: string | null;
};

// ─── Reviews ──────────────────────────────────────────────────────────────────

export type Review = {
  productId: string;
  reviewer: Principal;
  rating: bigint;
  reviewText: string;
  timestamp: Time;
  verifiedPurchase: boolean;
  variantId: string | null;
};

// ─── Portfolio & Gallery ──────────────────────────────────────────────────────

export type PortfolioItem = {
  id: string;
  title: string;
  description: string;
  image: ExternalBlob;
  category: string;
  createdAt: Time;
};

export type GalleryItem = {
  id: string;
  title: string;
  description: string;
  image: ExternalBlob;
  createdAt: Time;
  taggedProductIds: string[];
};

// ─── Blog ─────────────────────────────────────────────────────────────────────

export type BlogPost = {
  id: string;
  title: string;
  bodyText: string;
  image: ExternalBlob | null;
  createdAt: Time;
};

// ─── Comments ─────────────────────────────────────────────────────────────────

export enum CommentParentType {
  galleryItem = "galleryItem",
  blogPost = "blogPost",
}

export type Comment = {
  id: string;
  parentId: string;
  parentType: CommentParentType;
  name: string;
  text: string;
  timestamp: Time;
};

// ─── Commissions ──────────────────────────────────────────────────────────────

export type CommissionAddon = { name: string; price: bigint };

export enum CommissionRequestStatus {
  pending = "pending",
  accepted = "accepted",
  inProgress = "inProgress",
  completed = "completed",
  rejected = "rejected",
}

export type Commission = {
  id: string;
  title: string;
  description: string;
  basePrice: bigint;
  openSpots: bigint;
  totalSpots: bigint;
  addons: CommissionAddon[];
  createdAt: Time;
};

export type CommissionRequest = {
  id: string;
  commissionId: string;
  commissionTitle: string;
  name: string;
  discordUsername: string | null;
  phoneNumber: string | null;
  email: string | null;
  description: string;
  selectedAddons: CommissionAddon[];
  totalPrice: bigint;
  referenceImages: ExternalBlob[];
  status: CommissionRequestStatus;
  createdAt: Time;
};

// ─── Full backend interface ───────────────────────────────────────────────────
// backend.d.ts was regenerated and only contains Creator Dashboard methods.
// FullBackendInterface extends backendInterface with all legacy methods so
// hooks can call them via `useFullActor()` (a typed cast wrapper).
// We do NOT use module augmentation here because that would break config.ts
// (the Backend class there implements backendInterface and cannot be updated).

import type { backendInterface } from "./backend";

export interface FullBackendInterface extends backendInterface {
  // Products
  getProducts(): Promise<Array<Product>>;
  getProduct(id: string): Promise<Product | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addProduct(product: CreateProductData, images: any[]): Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateProduct(
    id: string,
    product: CreateProductData,
    images: any[],
  ): Promise<void>;
  deleteProduct(id: string): Promise<boolean>;
  deleteProducts(ids: string[]): Promise<boolean[]>;
  getProductVariants(productId: string): Promise<Array<ProductVariant>>;

  // Analytics
  recordAnalyticsEvent(eventType: unknown): Promise<void>;
  getAnalyticsData(): Promise<{
    mostClickedProducts: [string, bigint][];
    mostViewedContent: [string, bigint][];
    totalRevenue: bigint;
    orderCount: bigint;
    lowInventoryProducts: Product[];
  }>;

  // Orders
  getOrders(): Promise<Array<Order>>;
  getMyOrders(): Promise<Array<Order>>;
  getMyOrder(id: string): Promise<Order | null>;
  updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order>;
  viewCart(): Promise<Array<OrderItem>>;
  addItemToCart(item: OrderItem): Promise<void>;
  clearCart(): Promise<void>;
  checkout(): Promise<Order>;

  // Blog
  getBlogPosts(): Promise<Array<BlogPost>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addBlogPost(
    title: string,
    bodyText: string,
    image: any | null,
  ): Promise<BlogPost>;
  deleteBlogPost(id: string): Promise<boolean>;

  // Social gallery (old)
  getSocialMediaContent(): Promise<Array<SocialMediaContent>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addSocialMediaContent(data: {
    content: string;
    media: any[];
  }): Promise<SocialMediaContent>;

  // Gallery (new tagged items)
  getGalleryItems(): Promise<Array<GalleryItem>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addGalleryItem(
    title: string,
    description: string,
    image: any,
    taggedProductIds: string[],
  ): Promise<GalleryItem>;
  deleteGalleryItem(id: string): Promise<boolean>;
  updateGalleryItemTags(
    galleryItemId: string,
    taggedProductIds: string[],
  ): Promise<GalleryItem>;

  // Portfolio
  getPortfolioItems(): Promise<Array<PortfolioItem>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addPortfolioItem(
    title: string,
    description: string,
    image: any,
    category: string,
  ): Promise<PortfolioItem>;
  deletePortfolioItem(id: string): Promise<boolean>;

  // Messages
  getMessages(): Promise<Array<Message>>;
  getMyMessages(): Promise<Array<Message>>;
  sendMessage(content: string, recipient: Customer | null): Promise<Message>;

  // Discussion Board
  getAllDiscussionPosts(): Promise<Array<DiscussionPost>>;
  createDiscussionPost(question: string): Promise<DiscussionPost>;
  addReply(postId: string, content: string): Promise<DiscussionPost>;

  // Comments
  getCommentsByParent(
    parentId: string,
    parentType: CommentParentType,
  ): Promise<Array<Comment>>;
  addComment(
    parentId: string,
    parentType: CommentParentType,
    name: string,
    text: string,
  ): Promise<Comment>;

  // Notifications
  getUnreadNotifications(): Promise<Array<Notification>>;
  markNotificationAsRead(id: string): Promise<boolean>;

  // Reviews
  getProductReviews(productId: string): Promise<[Review[], number]>;
  submitReview(
    productId: string,
    rating: bigint,
    reviewText: string,
    variantId: string | null,
  ): Promise<Review>;

  // Commissions
  getCommissions(): Promise<Array<Commission>>;
  getCommission(id: string): Promise<Commission | null>;
  addCommission(
    title: string,
    description: string,
    basePrice: bigint,
    totalSpots: bigint,
    addons: CommissionAddon[],
  ): Promise<Commission>;
  updateCommission(
    commissionId: string,
    title: string,
    description: string,
    basePrice: bigint,
    totalSpots: bigint,
    addons: CommissionAddon[],
  ): Promise<Commission>;
  deleteCommission(id: string): Promise<boolean>;
  getCommissionRequests(): Promise<Array<CommissionRequest>>;
  submitCommissionRequest(
    commissionId: string,
    name: string,
    discordUsername: string | null,
    phoneNumber: string | null,
    email: string | null,
    description: string,
    selectedAddons: CommissionAddon[],
    referenceImages: ExternalBlob[],
  ): Promise<CommissionRequest>;
  updateCommissionRequestStatus(
    requestId: string,
    status: CommissionRequestStatus,
  ): Promise<CommissionRequest>;

  adminLoginWithPasscode(passcode: string): Promise<boolean>;

  // Legacy access control
  _initializeAccessControlWithSecret(secret: string): Promise<void>;
}
