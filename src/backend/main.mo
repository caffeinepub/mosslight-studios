import Array "mo:core/Array";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Initialize the access control state once
  let accessControlState = AccessControl.initState();

  include MixinStorage();

  include MixinAuthorization(accessControlState);

  public type Product = {
    id : Text;
    name : Text;
    description : Text;
    price : Nat;
    images : [Storage.ExternalBlob];
    inventory : Nat;
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
    status : OrderStatus;
    date : Time.Time;
  };

  public type OrderItem = {
    productId : Text;
    quantity : Nat;
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

  let products = Map.empty<Text, Product>();
  let orders = Map.empty<Text, Order>();
  let messages = Map.empty<Text, Message>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let shoppingCarts = Map.empty<Principal, List.List<OrderItem>>();

  public type CreateProductData = {
    name : Text;
    description : Text;
    price : Nat;
    inventory : Nat;
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

  module Product {
    public func compare(p1 : Product, p2 : Product) : Order.Order {
      Text.compare(p1.name, p2.name);
    };
  };

  var productIdCounter = 0;
  var orderIdCounter = 0;
  var messageIdCounter = 0;

  // New types for discussion board
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
    replies : [Reply]; // Immutable array for replies
  };

  let discussionPosts = Map.empty<Text, DiscussionPost>();
  var postIdCounter = 0;

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Product Management (Admin-only)
  public shared ({ caller }) func addProduct(productData : CreateProductData, images : [Storage.ExternalBlob]) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add products");
    };

    productIdCounter += 1;
    let id = "product_" # productIdCounter.toText();
    let product : Product = {
      id;
      name = productData.name;
      description = productData.description;
      price = productData.price;
      images;
      inventory = productData.inventory;
    };
    products.add(id, product);
  };

  public shared ({ caller }) func updateProduct(productId : Text, productData : CreateProductData, images : [Storage.ExternalBlob]) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update products");
    };

    switch (products.get(productId)) {
      case null {
        Runtime.trap("Product not found");
      };
      case (?existing) {
        let updated : Product = {
          id = productId;
          name = productData.name;
          description = productData.description;
          price = productData.price;
          images;
          inventory = productData.inventory;
        };
        products.add(productId, updated);
      };
    };
  };

  public shared ({ caller }) func deleteProduct(productId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };
    products.remove(productId);
  };

  // Order Management
  public shared ({ caller }) func updateOrderStatus(orderId : Text, status : OrderStatus) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can update order status");
    };

    switch (orders.get(orderId)) {
      case null {
        Runtime.trap("Order not found");
      };
      case (?order) {
        let updated : Order = {
          id = order.id;
          customer = order.customer;
          items = order.items;
          status;
          date = order.date;
        };
        orders.add(orderId, updated);
      };
    };
  };

  // Admin Messaging System
  public shared ({ caller }) func sendMessage(content : Text, recipient : ?Customer) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can send messages");
    };

    messageIdCounter += 1;
    let id = "msg_" # messageIdCounter.toText();
    let message : Message = {
      id;
      content;
      recipient;
      timestamp = Time.now();
    };
    messages.add(id, message);
  };

  // Discussion Board Methods
  public shared ({ caller }) func createDiscussionPost(question : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create posts");
    };

    postIdCounter += 1;
    let postId = "post_" # postIdCounter.toText();

    let newPost : DiscussionPost = {
      id = postId;
      question;
      author = caller;
      timestamp = Time.now();
      status = #open;
      replies = [];
    };

    discussionPosts.add(postId, newPost);
    postId;
  };

  public shared ({ caller }) func addReply(postId : Text, content : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can reply");
    };

    switch (discussionPosts.get(postId)) {
      case (null) {
        Runtime.trap("Post not found");
      };
      case (?post) {
        let reply : Reply = {
          author = caller;
          content;
          timestamp = Time.now();
        };

        let updatedReplies = post.replies.concat([reply]);

        let updatedPost : DiscussionPost = {
          post with
          replies = updatedReplies;
          status = #answered;
        };

        discussionPosts.add(postId, updatedPost);
      };
    };
  };

  public query ({ caller }) func getAllDiscussionPosts() : async [DiscussionPost] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view discussion posts");
    };
    discussionPosts.values().toArray();
  };

  // Public Product Catalog (No auth required)
  public query ({ caller }) func getProducts() : async [Product] {
    products.values().toArray().sort();
  };

  public query ({ caller }) func getProduct(productId : Text) : async ?Product {
    products.get(productId);
  };

  // Admin Order Dashboard
  public query ({ caller }) func getOrders() : async [Order] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all orders");
    };
    orders.values().toArray();
  };

  // Customer Order Tracking (User-only)
  public query ({ caller }) func getMyOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their orders");
    };

    orders.values().filter(func(order : Order) : Bool {
      order.customer == caller;
    }).toArray();
  };

  public query ({ caller }) func getMyOrder(orderId : Text) : async ?Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their orders");
    };

    switch (orders.get(orderId)) {
      case null { null };
      case (?order) {
        if (order.customer == caller) {
          ?order;
        } else {
          Runtime.trap("Unauthorized: Can only view your own orders");
        };
      };
    };
  };

  // Admin Messages View
  public query ({ caller }) func getMessages() : async [Message] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view messages");
    };
    messages.values().toArray();
  };

  // Customer Messages View
  public query ({ caller }) func getMyMessages() : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their messages");
    };

    messages.values().filter(func(msg : Message) : Bool {
      switch (msg.recipient) {
        case null { true }; // Broadcast messages
        case (?recipient) { recipient == caller };
      };
    }).toArray();
  };

  // Social Media Content (Public)
  public query ({ caller }) func getSocialMediaContent() : async [SocialMediaContent] {
    // Public content, no auth required
    [];
  };

  // Shopping Cart (Per-user, no auth required for guests)
  public shared ({ caller }) func addToCart(items : [OrderItem]) : async () {
    let cart = switch (shoppingCarts.get(caller)) {
      case null { List.empty<OrderItem>() };
      case (?existing) { existing };
    };

    let newCart = List.empty<OrderItem>();
    newCart.addAll(items.values());
    shoppingCarts.add(caller, newCart);
  };

  public shared ({ caller }) func addItemToCart(item : OrderItem) : async () {
    let cart = switch (shoppingCarts.get(caller)) {
      case null { List.empty<OrderItem>() };
      case (?existing) { existing };
    };

    cart.add(item);
    shoppingCarts.add(caller, cart);
  };

  public query ({ caller }) func viewCart() : async [OrderItem] {
    switch (shoppingCarts.get(caller)) {
      case null { [] };
      case (?cart) { cart.toArray() };
    };
  };

  public shared ({ caller }) func clearCart() : async () {
    shoppingCarts.remove(caller);
  };

  // Checkout (Requires user authentication)
  public shared ({ caller }) func checkout() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can checkout");
    };

    let cart = switch (shoppingCarts.get(caller)) {
      case null { Runtime.trap("Cart is empty") };
      case (?c) { c };
    };

    if (cart.isEmpty()) {
      Runtime.trap("Cart is empty");
    };

    let items = cart.toArray();

    // Validate inventory
    for (item in items.values()) {
      switch (products.get(item.productId)) {
        case null {
          Runtime.trap("Product not found: " # item.productId);
        };
        case (?product) {
          if (product.inventory < item.quantity) {
            Runtime.trap("Insufficient inventory for product: " # product.name);
          };
        };
      };
    };

    // Update inventory
    for (item in items.values()) {
      switch (products.get(item.productId)) {
        case null {};
        case (?product) {
          let updated : Product = {
            id = product.id;
            name = product.name;
            description = product.description;
            price = product.price;
            images = product.images;
            inventory = product.inventory - item.quantity;
          };
          products.add(product.id, updated);
        };
      };
    };

    orderIdCounter += 1;
    let orderId = "order_" # orderIdCounter.toText();

    let order : Order = {
      id = orderId;
      customer = caller;
      items;
      status = #pending;
      date = Time.now();
    };
    orders.add(orderId, order);

    // Clear the cart
    shoppingCarts.remove(caller);

    orderId;
  };
};
