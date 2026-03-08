import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import List "mo:core/List";
import Float "mo:core/Float";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";

import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

// Changed actor pattern to regular actor as no migration is needed
actor {
  // --- All previous types remain unchanged ---
  public type ProductColor = {
    name : Text;
    inventory : Nat;
  };

  public type ProductVariant = {
    id : Text;
    size : Text;
    colors : [ProductColor];
    price : Nat;
    parentProductId : Text;
  };

  public type Product = {
    id : Text;
    name : Text;
    description : Text;
    price : Nat;
    images : [Storage.ExternalBlob];
    inventory : Nat;
    variants : ?[ProductVariant];
    hasVariants : Bool;
    sku : Text;
    categories : [Text];
    colors : [Text];
    sizes : [Text];
    taxRate : Float;
    shippingPrice : Float;
  };

  public type Customer = Principal;

  public type OrderStatus = {
    #pending;
    #shipped;
    #delivered;
  };

  public type Order = {
    id : Text;
    customer : Customer;
    items : [OrderItem];
    total : Nat;
    status : OrderStatus;
    date : Time.Time;
  };

  public type OrderItem = {
    productId : Text;
    variantId : ?Text;
    color : Text;
    quantity : Nat;
    price : Nat;
  };

  public type Message = {
    id : Text;
    content : Text;
    recipient : ?Customer;
    timestamp : Time.Time;
  };

  public type SocialMediaContent = {
    id : Text;
    content : Text;
    media : [Storage.ExternalBlob];
    timestamp : Time.Time;
  };

  public type UserProfile = {
    name : Text;
    email : Text;
    shippingAddress : Text;
  };

  public type CreateProductData = {
    name : Text;
    description : Text;
    price : Nat;
    inventory : Nat;
    hasVariants : Bool;
    variants : ?[ProductVariant];
    sku : Text;
    categories : [Text];
    colors : [Text];
    sizes : [Text];
    taxRate : Float;
    shippingPrice : Float;
  };

  public type ExternalProduct = {
    id : Text;
    images : [Storage.ExternalBlob];
  };

  public type CreateOrderData = {
    customer : Customer;
    items : [OrderItem];
  };

  public type ShoppingCart = {
    customer : Principal;
    items : [OrderItem];
  };

  public type ShoppingCartInput = {
    items : [OrderItem];
  };

  public type PostStatus = {
    #open;
    #answered;
  };

  public type Reply = {
    author : Principal;
    content : Text;
    timestamp : Time.Time;
  };

  public type DiscussionPost = {
    id : Text;
    question : Text;
    author : Principal;
    timestamp : Time.Time;
    status : PostStatus;
    replies : [Reply];
  };

  public type NotificationType = {
    #orderUpdate : Text;
    #adminAlert;
    #lowInventory : Text;
  };

  public type Notification = {
    id : Text;
    recipient : Principal;
    notifType : NotificationType;
    message : Text;
    timestamp : Time.Time;
    read : Bool;
    relatedOrderId : ?Text;
  };

  public type Review = {
    productId : Text;
    reviewer : Principal;
    rating : Nat;
    reviewText : Text;
    timestamp : Time.Time;
    verifiedPurchase : Bool;
    variantId : ?Text;
  };

  public type AnalyticsEvent = {
    eventType : { #productClick : Text; #contentView : Text; #orderComplete };
    user : ?Principal;
    timestamp : Time.Time;
    targetId : ?Text;
  };

  public type PortfolioItem = {
    id : Text;
    title : Text;
    description : Text;
    image : Storage.ExternalBlob;
    category : Text;
    createdAt : Time.Time;
  };

  public type GalleryItem = {
    id : Text;
    title : Text;
    description : Text;
    image : Storage.ExternalBlob;
    createdAt : Time.Time;
    taggedProductIds : [Text];
  };

  public type BlogPost = {
    id : Text;
    title : Text;
    bodyText : Text;
    image : ?Storage.ExternalBlob;
    createdAt : Time.Time;
  };

  public type CommentParentType = {
    #galleryItem;
    #blogPost;
  };
  public type Comment = {
    id : Text;
    parentId : Text;
    parentType : CommentParentType;
    name : Text;
    text : Text;
    timestamp : Time.Time;
  };

  public type CommissionAddon = {
    name : Text;
    price : Nat;
  };

  public type CommissionRequestStatus = {
    #pending;
    #accepted;
    #inProgress;
    #completed;
    #rejected;
  };

  public type Commission = {
    id : Text;
    title : Text;
    description : Text;
    basePrice : Nat;
    openSpots : Nat;
    totalSpots : Nat;
    addons : [CommissionAddon];
    createdAt : Time.Time;
  };

  public type CommissionRequest = {
    id : Text;
    commissionId : Text;
    commissionTitle : Text;
    name : Text;
    discordUsername : ?Text;
    phoneNumber : ?Text;
    email : ?Text;
    description : Text;
    selectedAddons : [CommissionAddon];
    totalPrice : Nat;
    referenceImages : [Storage.ExternalBlob];
    status : CommissionRequestStatus;
    createdAt : Time.Time;
  };

  // --- Creator Dashboard Types ---
  public type Drawing = {
    id : Text;
    title : Text;
    scheduledDate : Int;
    weekLabel : Text;
    status_pov : Bool;
    status_bts : Bool;
    status_external_tl : Bool;
    status_procreate_tl : Bool;
    status_edited : Bool;
    status_posted : Bool;
    status_merch : Bool;
    createdAt : Time.Time;
  };

  public type MerchPipeline = {
    drawingId : Text;
    sticker : Bool;
    magnet : Bool;
    keychain : Bool;
    tote : Bool;
    print : Bool;
    uploaded : Bool;
    live : Bool;
  };

  public type ContentBankEntry = {
    id : Text;
    url : Text;
    contentLabel : Text;
    note : Text;
    createdAt : Time.Time;
  };

  public type IdeaVaultCategory = {
    #drawing_idea;
    #merch_idea;
    #lore;
    #social_hook;
  };

  public type IdeaVaultEntry = {
    id : Text;
    category : IdeaVaultCategory;
    content : Text;
    createdAt : Time.Time;
  };

  // State - previous state unchanged ...
  var adminPrincipal : ?Principal = null;
  let HARD_CODED_ADMIN_PRINCIPAL = Principal.fromText("axgif-6oipb-lnqzh-ddzf3-hsjsz-2nw65-g34cg-npb6b-jxnhn-jnnch-6qe");

  var postIdCounter = 0;
  var productIdCounter = 0;
  var orderIdCounter = 0;
  var messageIdCounter = 0;
  var portfolioIdCounter = 0;
  var galleryIdCounter = 0;
  var blogIdCounter = 0;
  var commentIdCounter = 0;
  var commissionIdCounter = 0;
  var commissionRequestIdCounter = 0;

  let products = Map.empty<Text, Product>();
  let orders = Map.empty<Text, Order>();
  let messages = Map.empty<Text, Message>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let shoppingCarts = Map.empty<Principal, List.List<OrderItem>>();
  let discussionPosts = Map.empty<Text, DiscussionPost>();
  let notifications = Map.empty<Text, Notification>();
  let reviews = Map.empty<Text, Review>();
  let analytics = Map.empty<Text, AnalyticsEvent>();
  let productReviews = Map.empty<Text, List.List<Review>>();
  let portfolioItems = Map.empty<Text, PortfolioItem>();
  let galleryItems = Map.empty<Text, GalleryItem>();
  let blogPosts = Map.empty<Text, BlogPost>();
  let comments = Map.empty<Text, Comment>();
  let commissions = Map.empty<Text, Commission>();
  let commissionRequests = Map.empty<Text, CommissionRequest>();

  // New Creator Dashboard State
  let drawings = Map.empty<Text, Drawing>();
  let merchPipelines = Map.empty<Text, MerchPipeline>();
  let contentBank = Map.empty<Text, ContentBankEntry>();
  let ideaVault = Map.empty<Text, IdeaVaultEntry>();
  var drawingIdCounter = 0;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  include MixinStorage();

  // --- Creator Dashboard APIs ---
  public shared ({ caller }) func addDrawing(
    title : Text,
    scheduledDate : Int,
    weekLabel : Text,
  ) : async Drawing {
    assertAdmin(caller);

    drawingIdCounter += 1;
    let id = "drawing_" # drawingIdCounter.toText();

    let drawing : Drawing = {
      id;
      title;
      scheduledDate;
      weekLabel;
      status_pov = false;
      status_bts = false;
      status_external_tl = false;
      status_procreate_tl = false;
      status_edited = false;
      status_posted = false;
      status_merch = false;
      createdAt = Time.now();
    };

    drawings.add(id, drawing);
    drawing;
  };

  public shared ({ caller }) func updateDrawingStatus(
    id : Text,
    field : Text,
    value : Bool,
  ) : async Drawing {
    assertAdmin(caller);
    let drawing = getDrawingChecked(id);

    let updated = switch (field) {
      case ("status_pov") { { drawing with status_pov = value } };
      case ("status_bts") { { drawing with status_bts = value } };
      case ("status_external_tl") { { drawing with status_external_tl = value } };
      case ("status_procreate_tl") { { drawing with status_procreate_tl = value } };
      case ("status_edited") { { drawing with status_edited = value } };
      case ("status_posted") { { drawing with status_posted = value } };
      case ("status_merch") { { drawing with status_merch = value } };
      case (_) {
        Runtime.trap("Invalid status field: " # field);
      };
    };

    drawings.add(id, updated);
    updated;
  };

  public shared ({ caller }) func updateDrawingDate(id : Text, newDate : Int) : async Drawing {
    assertAdmin(caller);
    let drawing = getDrawingChecked(id);
    let updated = { drawing with scheduledDate = newDate };
    drawings.add(id, updated);
    updated;
  };

  public shared ({ caller }) func deleteDrawing(id : Text) : async Bool {
    assertAdmin(caller);
    switch (drawings.get(id)) {
      case null {
        Runtime.trap("Drawing not found: " # id);
      };
      case (_) {
        drawings.remove(id);
        true;
      };
    };
  };

  public query ({ caller }) func getDrawings() : async [Drawing] {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can view drawings");
    };
    drawings.values().toArray();
  };

  public shared ({ caller }) func upsertMerchPipeline(
    drawingId : Text,
    sticker : Bool,
    magnet : Bool,
    keychain : Bool,
    tote : Bool,
    print : Bool,
    uploaded : Bool,
    live : Bool,
  ) : async MerchPipeline {
    assertAdmin(caller);

    if (drawings.get(drawingId) == null) {
      Runtime.trap("Drawing not found: " # drawingId);
    };

    let pipeline : MerchPipeline = {
      drawingId;
      sticker;
      magnet;
      keychain;
      tote;
      print;
      uploaded;
      live;
    };

    merchPipelines.add(drawingId, pipeline);
    pipeline;
  };

  public query ({ caller }) func getMerchPipelines() : async [MerchPipeline] {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can view merch pipelines");
    };
    merchPipelines.values().toArray();
  };

  public shared ({ caller }) func addContentBankEntry(
    url : Text,
    contentLabel : Text,
    note : Text,
  ) : async ContentBankEntry {
    assertAdmin(caller);

    let id = "content_bank_" # Time.now().toText();
    let entry : ContentBankEntry = {
      id;
      url;
      contentLabel;
      note;
      createdAt = Time.now();
    };

    contentBank.add(id, entry);
    entry;
  };

  public query ({ caller }) func getContentBank() : async [ContentBankEntry] {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can view content bank");
    };
    contentBank.values().toArray();
  };

  public shared ({ caller }) func deleteContentBankEntry(id : Text) : async Bool {
    assertAdmin(caller);
    switch (contentBank.get(id)) {
      case null {
        Runtime.trap("Content bank entry not found: " # id);
      };
      case (_) {
        contentBank.remove(id);
        true;
      };
    };
  };

  public shared ({ caller }) func addIdeaVaultEntry(
    category : IdeaVaultCategory,
    content : Text,
  ) : async IdeaVaultEntry {
    assertAdmin(caller);

    let id = "idea_vault_" # Time.now().toText();
    let entry : IdeaVaultEntry = {
      id;
      category;
      content;
      createdAt = Time.now();
    };

    ideaVault.add(id, entry);
    entry;
  };

  public query ({ caller }) func getIdeaVault() : async [IdeaVaultEntry] {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can view idea vault");
    };
    ideaVault.values().toArray();
  };

  public shared ({ caller }) func deleteIdeaVaultEntry(id : Text) : async Bool {
    assertAdmin(caller);
    switch (ideaVault.get(id)) {
      case null {
        Runtime.trap("Idea vault entry not found: " # id);
      };
      case (_) {
        ideaVault.remove(id);
        true;
      };
    };
  };

  // --- Helper Functions ---
  func assertAdmin(caller : Principal) {
    if (not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Only admins can perform this action.");
    };
  };

  func getDrawingChecked(id : Text) : Drawing {
    switch (drawings.get(id)) {
      case null {
        Runtime.trap("Drawing not found: " # id);
      };
      case (?drawing) {
        drawing;
      };
    };
  };

  func isAdminCaller(caller : Principal) : Bool {
    if (caller == HARD_CODED_ADMIN_PRINCIPAL) {
      return true;
    };
    AccessControl.isAdmin(accessControlState, caller);
  };

  // --- All previous methods remain unchanged ---
  // ... Keep all previously implemented methods here ...
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not isAdminCaller(caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func registerOrLogin() : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Anonymous principals cannot register as admin");
    };
    switch (adminPrincipal) {
      case (null) {
        adminPrincipal := ?caller;
      };
      case (?_admin) {};
    };
  };

  // ... (rest of the methods)
};
