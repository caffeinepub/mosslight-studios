import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Product {
    id: string;
    sku: string;
    categories: Array<string>;
    shippingPrice: number;
    hasVariants: boolean;
    inventory: bigint;
    name: string;
    description: string;
    variants?: Array<ProductVariant>;
    sizes: Array<string>;
    colors: Array<string>;
    price: bigint;
    taxRate: number;
    images: Array<ExternalBlob>;
}
export interface UserProfile {
    name: string;
    email: string;
    shippingAddress: string;
}
export interface Reply {
    content: string;
    author: Principal;
    timestamp: Time;
}
export type Time = bigint;
export interface SocialMediaContent {
    id: string;
    media: Array<ExternalBlob>;
    content: string;
    timestamp: Time;
}
export interface OrderItem {
    productId: string;
    variantId?: string;
    quantity: bigint;
    price: bigint;
}
export interface Comment {
    id: string;
    name: string;
    text: string;
    timestamp: Time;
    parentId: string;
    parentType: CommentParentType;
}
export interface DiscussionPost {
    id: string;
    status: PostStatus;
    question: string;
    author: Principal;
    timestamp: Time;
    replies: Array<Reply>;
}
export interface ProductVariant {
    id: string;
    inventory: bigint;
    color: string;
    size: string;
    parentProductId: string;
    price: bigint;
}
export interface Order {
    id: string;
    status: OrderStatus;
    total: bigint;
    customer: Customer;
    date: Time;
    items: Array<OrderItem>;
}
export type Customer = Principal;
export interface CreateProductData {
    sku: string;
    categories: Array<string>;
    shippingPrice: number;
    hasVariants: boolean;
    inventory: bigint;
    name: string;
    description: string;
    variants?: Array<ProductVariant>;
    sizes: Array<string>;
    colors: Array<string>;
    price: bigint;
    taxRate: number;
}
export type NotificationType = {
    __kind__: "adminAlert";
    adminAlert: null;
} | {
    __kind__: "orderUpdate";
    orderUpdate: string;
} | {
    __kind__: "lowInventory";
    lowInventory: string;
};
export interface PortfolioItem {
    id: string;
    title: string;
    createdAt: Time;
    description: string;
    category: string;
    image: ExternalBlob;
}
export interface Notification {
    id: string;
    notifType: NotificationType;
    read: boolean;
    recipient: Principal;
    message: string;
    timestamp: Time;
    relatedOrderId?: string;
}
export interface Message {
    id: string;
    content: string;
    recipient?: Customer;
    timestamp: Time;
}
export interface BlogPost {
    id: string;
    title: string;
    createdAt: Time;
    image?: ExternalBlob;
    bodyText: string;
}
export interface GalleryItem {
    id: string;
    title: string;
    createdAt: Time;
    description: string;
    image: ExternalBlob;
}
export interface Review {
    reviewText: string;
    productId: string;
    variantId?: string;
    timestamp: Time;
    rating: bigint;
    reviewer: Principal;
    verifiedPurchase: boolean;
}
export enum CommentParentType {
    blogPost = "blogPost",
    galleryItem = "galleryItem"
}
export enum OrderStatus {
    shipped = "shipped",
    pending = "pending",
    delivered = "delivered"
}
export enum PostStatus {
    open = "open",
    answered = "answered"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addBlogPost(title: string, bodyText: string, image: ExternalBlob | null): Promise<string>;
    addComment(parentId: string, parentType: CommentParentType, name: string, text: string): Promise<string>;
    addGalleryItem(title: string, description: string, image: ExternalBlob): Promise<string>;
    addItemToCart(item: OrderItem): Promise<void>;
    addPortfolioItem(title: string, description: string, image: ExternalBlob, category: string): Promise<string>;
    addProduct(product: CreateProductData, images: Array<ExternalBlob>): Promise<void>;
    addReply(postId: string, content: string): Promise<void>;
    addToCart(items: Array<OrderItem>): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkout(): Promise<string>;
    clearCart(): Promise<void>;
    createDiscussionPost(question: string): Promise<string>;
    deleteProduct(productId: string): Promise<void>;
    getAllDiscussionPosts(): Promise<Array<DiscussionPost>>;
    getAnalyticsData(): Promise<{
        mostClickedProducts: Array<[string, bigint]>;
        mostViewedContent: Array<[string, bigint]>;
        orderCount: bigint;
        totalRevenue: bigint;
        lowInventoryProducts: Array<Product>;
    }>;
    getBlogPosts(): Promise<Array<BlogPost>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCommentsByParent(parentId: string, parentType: CommentParentType): Promise<Array<Comment>>;
    getGalleryItems(): Promise<Array<GalleryItem>>;
    getMessages(): Promise<Array<Message>>;
    getMyMessages(): Promise<Array<Message>>;
    getMyOrder(orderId: string): Promise<Order | null>;
    getMyOrders(): Promise<Array<Order>>;
    getOrders(): Promise<Array<Order>>;
    getPortfolioItems(): Promise<Array<PortfolioItem>>;
    getProduct(productId: string): Promise<Product | null>;
    getProductReviews(productId: string): Promise<[Array<Review>, number]>;
    getProductVariants(productId: string): Promise<Array<ProductVariant> | null>;
    getProducts(): Promise<Array<Product>>;
    getSocialMediaContent(): Promise<Array<SocialMediaContent>>;
    getUnreadNotifications(): Promise<Array<Notification>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    markNotificationAsRead(notificationId: string): Promise<void>;
    recordAnalyticsEvent(eventType: {
        __kind__: "orderComplete";
        orderComplete: null;
    } | {
        __kind__: "contentView";
        contentView: string;
    } | {
        __kind__: "productClick";
        productClick: string;
    }): Promise<void>;
    registerOrLogin(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendAdminBroadcastAlert(message: string): Promise<void>;
    sendMessage(content: string, recipient: Customer | null): Promise<void>;
    submitReview(productId: string, rating: bigint, reviewText: string, variantId: string | null): Promise<void>;
    updateOrderStatus(orderId: string, status: OrderStatus): Promise<void>;
    updateProduct(productId: string, productData: CreateProductData, images: Array<ExternalBlob>): Promise<void>;
    viewCart(): Promise<Array<OrderItem>>;
}
