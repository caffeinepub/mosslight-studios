import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
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

  var productIdCounter = 0;
  var orderIdCounter = 0;
  var messageIdCounter = 0;

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

  let products = Map.empty<Text, Product>();
  let orders = Map.empty<Text, Order>();
  let messages = Map.empty<Text, Message>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let shoppingCarts = Map.empty<Principal, List.List<OrderItem>>();
  let discussionPosts = Map.empty<Text, DiscussionPost>();
  var postIdCounter = 0;

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
  };

  public type AnalyticsEvent = {
    eventType : { #productClick : Text; #contentView : Text; #orderComplete };
    user : ?Principal;
    timestamp : Time.Time;
    targetId : ?Text;
  };

  let notifications = Map.empty<Text, Notification>();
  let reviews = Map.empty<Text, Review>();
  let analytics = Map.empty<Text, AnalyticsEvent>();
  let productReviews = Map.empty<Text, List.List<Review>>();

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
    sendLowInventoryNotifications(id);
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
        sendLowInventoryNotifications(productId);
      };
    };
  };

  public shared ({ caller }) func deleteProduct(productId : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can delete products");
    };
    products.remove(productId);
  };

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
        createOrderUpdateNotification(order.customer, orderId, status);
      };
    };
  };

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

  public shared ({ caller }) func sendAdminBroadcastAlert(message : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can send broadcast alerts");
    };

    // Send notification to all users with admin role
    for ((principal, _) in userProfiles.entries()) {
      if (AccessControl.isAdmin(accessControlState, principal)) {
        messageIdCounter += 1;
        let id = "notif_" # messageIdCounter.toText();
        let notification : Notification = {
          id;
          recipient = principal;
          notifType = #adminAlert;
          message;
          timestamp = Time.now();
          read = false;
          relatedOrderId = null;
        };
        notifications.add(id, notification);
      };
    };
  };

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

  public query ({ caller }) func getProducts() : async [Product] {
    // Public access - no authorization needed
    products.values().toArray();
  };

  public query ({ caller }) func getProduct(productId : Text) : async ?Product {
    // Public access - no authorization needed
    products.get(productId);
  };

  public query ({ caller }) func getOrders() : async [Order] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view all orders");
    };
    orders.values().toArray();
  };

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

  public query ({ caller }) func getMessages() : async [Message] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view messages");
    };
    messages.values().toArray();
  };

  public query ({ caller }) func getMyMessages() : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view their messages");
    };

    messages.values().filter(func(msg : Message) : Bool {
      switch (msg.recipient) {
        case null { true };
        case (?recipient) { recipient == caller };
      };
    }).toArray();
  };

  public query ({ caller }) func getSocialMediaContent() : async [SocialMediaContent] {
    // Public access - no authorization needed
    [];
  };

  public shared ({ caller }) func addToCart(items : [OrderItem]) : async () {
    // Public access - guests can add to cart
    let cart = switch (shoppingCarts.get(caller)) {
      case null { List.empty<OrderItem>() };
      case (?existing) { existing };
    };

    let newCart = List.empty<OrderItem>();
    newCart.addAll(items.values());
    shoppingCarts.add(caller, newCart);
  };

  public shared ({ caller }) func addItemToCart(item : OrderItem) : async () {
    // Public access - guests can add to cart
    let cart = switch (shoppingCarts.get(caller)) {
      case null { List.empty<OrderItem>() };
      case (?existing) { existing };
    };

    cart.add(item);
    shoppingCarts.add(caller, cart);
  };

  public query ({ caller }) func viewCart() : async [OrderItem] {
    // Public access - anyone can view their own cart
    switch (shoppingCarts.get(caller)) {
      case null { [] };
      case (?cart) { cart.toArray() };
    };
  };

  public shared ({ caller }) func clearCart() : async () {
    // Public access - anyone can clear their own cart
    shoppingCarts.remove(caller);
  };

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

    // Update inventory and create low inventory notification if needed
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

          if (updated.inventory < 5) {
            sendLowInventoryNotifications(product.id);
          };
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

    // Record analytics event for order completion
    let analyticsId = "analytics_" # Time.now().toText();
    let event : AnalyticsEvent = {
      eventType = #orderComplete;
      user = ?caller;
      timestamp = Time.now();
      targetId = ?orderId;
    };
    analytics.add(analyticsId, event);

    orderId;
  };

  public query ({ caller }) func getUnreadNotifications() : async [Notification] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view notifications");
    };

    let unread = notifications.values().filter(
      func(n) {
        n.recipient == caller and not n.read;
      }
    );
    unread.toArray();
  };

  public shared ({ caller }) func markNotificationAsRead(notificationId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can mark notifications as read");
    };

    switch (notifications.get(notificationId)) {
      case null { Runtime.trap("Notification not found") };
      case (?notification) {
        if (notification.recipient != caller) {
          Runtime.trap("Unauthorized: Can only mark your own notifications as read");
        };
        let updated : Notification = { notification with read = true };
        notifications.add(notificationId, updated);
      };
    };
  };

  func createOrderUpdateNotification(recipient : Principal, orderId : Text, status : OrderStatus) {
    messageIdCounter += 1;
    let id = "notif_" # messageIdCounter.toText();
    let message = switch (status) {
      case (#pending) { "Your order " # orderId # " is now pending." };
      case (#shipped) { "Your order " # orderId # " has been shipped." };
      case (#delivered) { "Your order " # orderId # " has been delivered." };
    };
    let notification : Notification = {
      id;
      recipient;
      notifType = #orderUpdate(orderId);
      message;
      timestamp = Time.now();
      read = false;
      relatedOrderId = ?orderId;
    };
    notifications.add(id, notification);
  };

  func sendLowInventoryNotifications(productId : Text) {
    switch (products.get(productId)) {
      case null {};
      case (?product) {
        if (product.inventory < 5) {
          // Send notification to all admins
          for ((principal, _) in userProfiles.entries()) {
            if (AccessControl.isAdmin(accessControlState, principal)) {
              messageIdCounter += 1;
              let id = "notif_" # messageIdCounter.toText();
              let message = "Low inventory alert: Product '" # product.name # "' (ID: " # productId # ") has only " # product.inventory.toText() # " units remaining.";
              let notification : Notification = {
                id;
                recipient = principal;
                notifType = #lowInventory(productId);
                message;
                timestamp = Time.now();
                read = false;
                relatedOrderId = null;
              };
              notifications.add(id, notification);
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func submitReview(productId : Text, rating : Nat, reviewText : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can submit reviews");
    };

    if (rating < 1 or rating > 5) {
      Runtime.trap("Rating must be between 1 and 5");
    };

    // Check if user has purchased product
    let hasPurchased = orders.values().any(func(o) { o.customer == caller and o.items.findIndex(func(item) { item.productId == productId }) != null });

    if (not hasPurchased) {
      Runtime.trap("You can only review products you've purchased");
    };

    let review : Review = {
      productId;
      reviewer = caller;
      rating;
      reviewText;
      timestamp = Time.now();
      verifiedPurchase = true;
    };

    // Update product reviews
    let existingReviews = switch (productReviews.get(productId)) {
      case (null) { List.empty<Review>() };
      case (?existing) { existing };
    };

    existingReviews.add(review);
    productReviews.add(productId, existingReviews);
  };

  public query ({ caller }) func getProductReviews(productId : Text) : async ([Review], Float) {
    // Public access - anyone can view product reviews
    let reviewsList = switch (productReviews.get(productId)) {
      case (null) { List.empty<Review>() };
      case (?existing) { existing };
    };

    let reviews = reviewsList.toArray();
    let totalReviews = reviews.size();

    let avgRating = if (totalReviews > 0) {
      let sum = reviews.values().foldLeft(0, func(acc, review) { acc + review.rating });
      sum.toFloat() / totalReviews.toNat().toFloat();
    } else { 0.0 };

    (reviews, avgRating);
  };

  public shared ({ caller }) func recordAnalyticsEvent(eventType : { #productClick : Text; #contentView : Text; #orderComplete }) : async () {
    // Public access - guests and users can record analytics events
    let id = "analytics_" # Time.now().toText();
    let userPrincipal = if (caller.isAnonymous()) {
      null
    } else {
      ?caller
    };

    let event : AnalyticsEvent = {
      eventType;
      user = userPrincipal;
      timestamp = Time.now();
      targetId = switch (eventType) {
        case (#productClick(productId)) { ?productId };
        case (#contentView(contentId)) { ?contentId };
        case (#orderComplete) { null };
      };
    };

    analytics.add(id, event);
  };

  public query ({ caller }) func getAnalyticsData() : async {
    mostClickedProducts : [(Text, Nat)];
    mostViewedContent : [(Text, Nat)];
    totalRevenue : Nat;
    orderCount : Nat;
    lowInventoryProducts : [Product];
  } {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view analytics data");
    };

    // Calculate most clicked products
    let productClicks = Map.empty<Text, Nat>();
    for (event in analytics.values()) {
      switch (event.eventType) {
        case (#productClick(productId)) {
          let count = switch (productClicks.get(productId)) {
            case (null) { 0 };
            case (?existing) { existing };
          };
          productClicks.add(productId, count + 1);
        };
        case (_) {};
      };
    };

    let mostClicked = productClicks.toArray();

    // Calculate most viewed content
    let contentViews = Map.empty<Text, Nat>();
    for (event in analytics.values()) {
      switch (event.eventType) {
        case (#contentView(contentId)) {
          let count = switch (contentViews.get(contentId)) {
            case (null) { 0 };
            case (?existing) { existing };
          };
          contentViews.add(contentId, count + 1);
        };
        case (_) {};
      };
    };

    let mostViewed = contentViews.toArray();

    // Calculate total revenue and order count
    var totalRevenue = 0;
    let orderCount = orders.size();

    for (order in orders.values()) {
      for (item in order.items.values()) {
        switch (products.get(item.productId)) {
          case (null) {};
          case (?product) {
            totalRevenue += product.price * item.quantity;
          };
        };
      };
    };

    // Find low inventory products
    let lowInventory = products.values().filter(func(p) { p.inventory < 5 }).toArray();

    {
      mostClickedProducts = mostClicked;
      mostViewedContent = mostViewed;
      totalRevenue;
      orderCount;
      lowInventoryProducts = lowInventory;
    };
  };
};
