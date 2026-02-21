import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();

  include MixinStorage();
  include MixinAuthorization(accessControlState);

  public type ProductVariant = {
    id : Text;
    size : Text;
    color : Text;
    price : Nat;
    inventory : Nat;
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
    variantId : ?Text;
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
    hasVariants : Bool;
    variants : ?[ProductVariant];
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
    variantId : ?Text;
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

  func validateVarientDataStructure(product : CreateProductData) {
    let variantData = product.variants;
    switch (variantData) {
      case (null) {
        let sizeArray = [1.89, 2.11, 2.67, 3.09];
        let _resizedArray = Array.tabulate(4, func(i) { sizeArray[i] });
        Runtime.trap("It's required to provide data for each of the 4 available variants: 2X2, 3X3, 4X4, 6X6. Please try again.");
      };
      case (?variants) {
        let sizeArray = [1.89, 2.11, 2.67, 3.09];
        let _resizedArray = Array.tabulate(variants.size(), func(i) { sizeArray[i] });

        let hasAllVariants = (
          variants.any(func(v) { v.size == "2X2" }) and variants.any(func(v) { v.size == "3X3" }) and variants.any(func(v) { v.size == "4X4" }) and variants.any(func(v) { v.size == "6X6" })
        );

        if (not hasAllVariants) {
          Runtime.trap("You must provide data for all 4 available variants: 2X2, 3X3, 4X4, 6X6.");
        };
      };
    };
  };

  public shared ({ caller }) func addProduct(product : CreateProductData, images : [Storage.ExternalBlob]) : async () {
    // Check if caller is admin
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add products");
    };

    validateVarientDataStructure(product);

    let variantsToCheck = switch (product.variants) {
      case (null) { [] };
      case (?variants) { variants };
    };

    for (variant in variantsToCheck.values()) {
      if (variant.price == 0) {
        Runtime.trap("Price must be provided for each variant");
      };
      if (variant.inventory == 0) {
        Runtime.trap("Inventory must be provided for each variant");
      };
      if (variant.color == "") {
        Runtime.trap("Color must be provided for each variant");
      };
      if (variant.size == "") {
        Runtime.trap("Size must be provided for each variant");
      };
      if (variant.id == "") {
        Runtime.trap("Id must be provided for each variant");
      };
      if (variant.parentProductId == "") {
        Runtime.trap("parentProductId must be provided for each variant");
      };
    };

    productIdCounter += 1;
    let id = "product_" # productIdCounter.toText();
    let productWithId = {
      id;
      name = product.name;
      description = product.description;
      price = product.price;
      images;
      inventory = product.inventory;
      variants = product.variants;
      hasVariants = product.hasVariants;
    };
    products.add(id, productWithId);
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
          hasVariants = productData.hasVariants;
          variants = productData.variants;
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
    products.values().toArray();
  };

  public query ({ caller }) func getProduct(productId : Text) : async ?Product {
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
    [];
  };

  public shared ({ caller }) func addToCart(items : [OrderItem]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add items to cart");
    };

    for (item in items.values()) {
      switch (products.get(item.productId)) {
        case null {
          Runtime.trap("Product not found: " # item.productId);
        };
        case (?product) {
          if (product.hasVariants and product.variants != null) {
            let variants = product.variants.get([]);
            switch (item.variantId) {
              case null {
                Runtime.trap("Variant required for product: " # product.name);
              };
              case (?variantId) {
                let variant = variants.find(func(v) { v.id == variantId });
                switch (variant) {
                  case null {
                    Runtime.trap("Variant not found for product: " # product.name);
                  };
                  case (?v) {
                    if (v.inventory < item.quantity) {
                      Runtime.trap("Insufficient inventory for variant");
                    };
                  };
                };
              };
            };
          } else {
            if (product.inventory < item.quantity) {
              Runtime.trap("Insufficient inventory for product: " # product.name);
            };
          };
        };
      };
    };

    let cart = switch (shoppingCarts.get(caller)) {
      case null { List.empty<OrderItem>() };
      case (?existing) { existing };
    };

    let newCart = List.empty<OrderItem>();
    newCart.addAll(items.values());
    shoppingCarts.add(caller, newCart);
  };

  public shared ({ caller }) func addItemToCart(item : OrderItem) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add items to cart");
    };

    switch (products.get(item.productId)) {
      case null {
        Runtime.trap("Product not found: " # item.productId);
      };
      case (?product) {
        if (product.hasVariants and product.variants != null) {
          let variants = product.variants.get([]);
          switch (item.variantId) {
            case null {
              Runtime.trap("Variant required for product: " # product.name);
            };
            case (?variantId) {
              let variant = variants.find(func(v) { v.id == variantId });
              switch (variant) {
                case null {
                  Runtime.trap("Variant not found for product: " # product.name);
                };
                case (?v) {
                  if (v.inventory < item.quantity) {
                    Runtime.trap("Insufficient inventory for variant");
                  };
                };
              };
            };
          };
        } else {
          if (product.inventory < item.quantity) {
            Runtime.trap("Insufficient inventory for product: " # product.name);
          };
        };
      };
    };

    let cart = switch (shoppingCarts.get(caller)) {
      case null { List.empty<OrderItem>() };
      case (?existing) { existing };
    };

    cart.add(item);
    shoppingCarts.add(caller, cart);
  };

  public query ({ caller }) func viewCart() : async [OrderItem] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view cart");
    };

    switch (shoppingCarts.get(caller)) {
      case null { [] };
      case (?cart) { cart.toArray() };
    };
  };

  public shared ({ caller }) func clearCart() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can clear cart");
    };

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

    for (item in items.values()) {
      switch (products.get(item.productId)) {
        case null {
          Runtime.trap("Product not found: " # item.productId);
        };
        case (?product) {
          if (product.hasVariants and product.variants != null) {
            let variants = product.variants.get([]);
            switch (item.variantId) {
              case null {
                Runtime.trap("Variant required for product: " # product.name);
              };
              case (?variantId) {
                let variant = variants.find(func(v) { v.id == variantId });
                switch (variant) {
                  case null {
                    Runtime.trap("Variant not found for product: " # product.name);
                  };
                  case (?v) {
                    if (v.inventory < item.quantity) {
                      Runtime.trap("Insufficient inventory for variant");
                    };
                  };
                };
              };
            };
          } else {
            if (product.inventory < item.quantity) {
              Runtime.trap("Insufficient inventory for product: " # product.name);
            };
          };
        };
      };
    };

    for (item in items.values()) {
      switch (products.get(item.productId)) {
        case null {};
        case (?product) {
          if (product.hasVariants and product.variants != null) {
            let variants = product.variants.get([]);
            switch (item.variantId) {
              case null {};
              case (?variantId) {
                let variantOpt = variants.find(func(v) { v.id == variantId });
                switch (variantOpt) {
                  case null {};
                  case (?variant) {
                    let updatedVariants = variants.map(
                      func(v) {
                        if (v.id == variantId) {
                          { v with inventory = v.inventory - item.quantity };
                        } else {
                          v;
                        };
                      }
                    );
                    let updatedProduct = {
                      product with
                      variants = ?updatedVariants;
                    };
                    products.add(product.id, updatedProduct);
                  };
                };
              };
            };
          } else {
            let updatedProduct = {
              product with
              inventory = product.inventory - item.quantity;
            };
            products.add(product.id, updatedProduct);

            if (updatedProduct.inventory < 5) {
              sendLowInventoryNotifications(product.id);
            };
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

    shoppingCarts.remove(caller);

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

  public query ({ caller }) func getProductVariants(productId : Text) : async ?[ProductVariant] {
    switch (products.get(productId)) {
      case null { null };
      case (?product) { product.variants };
    };
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

  public shared ({ caller }) func submitReview(productId : Text, rating : Nat, reviewText : Text, variantId : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can submit reviews");
    };

    if (rating < 1 or rating > 5) {
      Runtime.trap("Rating must be between 1 and 5");
    };

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
      variantId;
    };

    let existingReviews = switch (productReviews.get(productId)) {
      case (null) { List.empty<Review>() };
      case (?existing) { existing };
    };

    existingReviews.add(review);
    productReviews.add(productId, existingReviews);
  };

  public query ({ caller }) func getProductReviews(productId : Text) : async ([Review], Float) {
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
