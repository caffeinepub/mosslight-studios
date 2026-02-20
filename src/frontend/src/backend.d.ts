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
export interface UserProfile {
    name: string;
    email: string;
    shippingAddress: string;
}
export interface SocialMediaContent {
    id: string;
    media: Array<ExternalBlob>;
    content: string;
    timestamp: Time;
}
export interface Reply {
    content: string;
    author: Principal;
    timestamp: Time;
}
export type Time = bigint;
export interface OrderItem {
    productId: string;
    quantity: bigint;
}
export interface DiscussionPost {
    id: string;
    status: PostStatus;
    question: string;
    author: Principal;
    timestamp: Time;
    replies: Array<Reply>;
}
export interface Order {
    id: string;
    status: OrderStatus;
    customer: Customer;
    date: Time;
    items: Array<OrderItem>;
}
export type Customer = Principal;
export interface CreateProductData {
    inventory: bigint;
    name: string;
    description: string;
    price: bigint;
}
export interface Message {
    id: string;
    content: string;
    recipient?: Customer;
    timestamp: Time;
}
export interface Product {
    id: string;
    inventory: bigint;
    name: string;
    description: string;
    price: bigint;
    images: Array<ExternalBlob>;
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
    addItemToCart(item: OrderItem): Promise<void>;
    addProduct(productData: CreateProductData, images: Array<ExternalBlob>): Promise<void>;
    addReply(postId: string, content: string): Promise<void>;
    addToCart(items: Array<OrderItem>): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkout(): Promise<string>;
    clearCart(): Promise<void>;
    createDiscussionPost(question: string): Promise<string>;
    deleteProduct(productId: string): Promise<void>;
    getAllDiscussionPosts(): Promise<Array<DiscussionPost>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMessages(): Promise<Array<Message>>;
    getMyMessages(): Promise<Array<Message>>;
    getMyOrder(orderId: string): Promise<Order | null>;
    getMyOrders(): Promise<Array<Order>>;
    getOrders(): Promise<Array<Order>>;
    getProduct(productId: string): Promise<Product | null>;
    getProducts(): Promise<Array<Product>>;
    getSocialMediaContent(): Promise<Array<SocialMediaContent>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(content: string, recipient: Customer | null): Promise<void>;
    updateOrderStatus(orderId: string, status: OrderStatus): Promise<void>;
    updateProduct(productId: string, productData: CreateProductData, images: Array<ExternalBlob>): Promise<void>;
    viewCart(): Promise<Array<OrderItem>>;
}
