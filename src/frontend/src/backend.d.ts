import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Drawing {
    id: string;
    status_external_tl: boolean;
    title: string;
    scheduledDate: bigint;
    status_merch: boolean;
    createdAt: Time;
    status_posted: boolean;
    status_bts: boolean;
    status_pov: boolean;
    status_procreate_tl: boolean;
    weekLabel: string;
    status_edited: boolean;
}
export interface ContentBankEntry {
    id: string;
    url: string;
    note: string;
    createdAt: Time;
    contentLabel: string;
}
export type Time = bigint;
export interface IdeaVaultEntry {
    id: string;
    content: string;
    createdAt: Time;
    category: IdeaVaultCategory;
}
export interface UserProfile {
    name: string;
    email: string;
    shippingAddress: string;
}
export interface MerchPipeline {
    live: boolean;
    tote: boolean;
    uploaded: boolean;
    magnet: boolean;
    sticker: boolean;
    print: boolean;
    drawingId: string;
    keychain: boolean;
}
export enum IdeaVaultCategory {
    merch_idea = "merch_idea",
    social_hook = "social_hook",
    lore = "lore",
    drawing_idea = "drawing_idea"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addContentBankEntry(url: string, contentLabel: string, note: string): Promise<ContentBankEntry>;
    addDrawing(title: string, scheduledDate: bigint, weekLabel: string): Promise<Drawing>;
    addIdeaVaultEntry(category: IdeaVaultCategory, content: string): Promise<IdeaVaultEntry>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteContentBankEntry(id: string): Promise<boolean>;
    deleteDrawing(id: string): Promise<boolean>;
    deleteIdeaVaultEntry(id: string): Promise<boolean>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getContentBank(): Promise<Array<ContentBankEntry>>;
    getDrawings(): Promise<Array<Drawing>>;
    getIdeaVault(): Promise<Array<IdeaVaultEntry>>;
    getMerchPipelines(): Promise<Array<MerchPipeline>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    registerOrLogin(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateDrawingDate(id: string, newDate: bigint): Promise<Drawing>;
    updateDrawingStatus(id: string, field: string, value: boolean): Promise<Drawing>;
    upsertMerchPipeline(drawingId: string, sticker: boolean, magnet: boolean, keychain: boolean, tote: boolean, print: boolean, uploaded: boolean, live: boolean): Promise<MerchPipeline>;
}
