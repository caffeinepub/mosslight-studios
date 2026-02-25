import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
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
    sku : Text;
    categories : [Text];
    colors : [Text];
    sizes : [Text];
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

  var adminPrincipal : ?Principal = null;
  let HARD_CODED_ADMIN_PRINCIPAL = Principal.fromText("axgif-6oipb-lnqzh-ddzf3-hsjsz-2nw65-g34cg-npb6b-jxnhn-jnnch-6qe");

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  include MixinStorage();

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
    if (not isAdmin(caller) and not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not isAdmin(caller) and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not isAdmin(caller) and not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  func isAdmin(caller : Principal) : Bool {
    let currentAdmin = switch (adminPrincipal) {
      case (?admin) { admin };
      case (null) { HARD_CODED_ADMIN_PRINCIPAL };
    };
    caller == currentAdmin;
  };

  func requireAdmin(caller : Principal) {
    if (not isAdmin(caller) and not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Admin access required");
    };
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

  public shared ({ caller }) func addProduct(product : CreateProductData, images : [Storage.ExternalBlob]) : async () {
    requireAdmin(caller);

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
    };

    productIdCounter += 1;
    let id = "product_" # productIdCounter.toText();

    let productWithVariantsSet = {
      id;
      name = product.name;
      description = product.description;
      price = product.price;
      images;
      inventory = product.inventory;
      hasVariants = product.hasVariants;
      sku = product.sku;
      categories = product.categories;
      colors = product.colors;
      sizes = product.sizes;
      variants = switch (product.variants) {
        case (null) { null };
        case (?variants) {
          ?variants.map(func(variant) { { variant with parentProductId = id } });
        };
      };
    };

    products.add(id, productWithVariantsSet);
    sendLowInventoryNotifications(id);
  };

  public shared ({ caller }) func updateProduct(productId : Text, productData : CreateProductData, images : [Storage.ExternalBlob]) : async () {
    requireAdmin(caller);
    switch (products.get(productId)) {
      case null {
        Runtime.trap("Product not found");
      };
      case (?existing) {
        let updatedProduct : Product = {
          existing with
          name = productData.name;
          description = productData.description;
          price = productData.price;
          images;
          inventory = productData.inventory;
          hasVariants = productData.hasVariants;
          sku = productData.sku;
          categories = productData.categories;
          colors = productData.colors;
          sizes = productData.sizes;
          variants = switch (productData.variants) {
            case (null) { null };
            case (?variants) {
              ?variants.map(func(variant) { { variant with parentProductId = productId } });
            };
          };
        };
        products.add(productId, updatedProduct);
        sendLowInventoryNotifications(productId);
      };
    };
  };

  public shared ({ caller }) func deleteProduct(productId : Text) : async () {
    requireAdmin(caller);
    products.remove(productId);
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Text, status : OrderStatus) : async () {
    requireAdmin(caller);

    switch (orders.get(orderId)) {
      case null {
        Runtime.trap("Order not found");
      };
      case (?order) {
        let updated : Order = {
          id = order.id;
          customer = order.customer;
          items = order.items;
          total = order.total;
          status;
          date = order.date;
        };
        orders.add(orderId, updated);
        createOrderUpdateNotification(order.customer, orderId, status);
      };
    };
  };

  public shared ({ caller }) func sendMessage(content : Text, recipient : ?Customer) : async () {
    if (not isAdmin(caller) and not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can send messages");
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
    requireAdmin(caller);

    for ((principal, _) in userProfiles.entries()) {
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

  public shared ({ caller }) func createDiscussionPost(question : Text) : async Text {
    if (not isAdmin(caller) and not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create discussion posts");
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
    if (not isAdmin(caller) and not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add replies");
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
    discussionPosts.values().toArray();
  };

  public query ({ caller }) func getProducts() : async [Product] {
    products.values().toArray();
  };

  public query ({ caller }) func getProduct(productId : Text) : async ?Product {
    products.get(productId);
  };

  public query ({ caller }) func getOrders() : async [Order] {
    requireAdmin(caller);
    orders.values().toArray();
  };

  public query ({ caller }) func getMyOrders() : async [Order] {
    if (not isAdmin(caller) and not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    orders.values().filter(func(order : Order) : Bool {
      order.customer == caller;
    }).toArray();
  };

  public query ({ caller }) func getMyOrder(orderId : Text) : async ?Order {
    if (not isAdmin(caller) and not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view orders");
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
    requireAdmin(caller);
    messages.values().toArray();
  };

  public query ({ caller }) func getMyMessages() : async [Message] {
    if (not isAdmin(caller) and not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view messages");
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
    if (not isAdmin(caller) and not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add to cart");
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
    if (not isAdmin(caller) and not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add items to cart");
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
    if (not isAdmin(caller) and not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view cart");
    };

    switch (shoppingCarts.get(caller)) {
      case null { [] };
      case (?cart) { cart.toArray() };
    };
  };

  public shared ({ caller }) func clearCart() : async () {
    if (not isAdmin(caller) and not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can clear cart");
    };
    shoppingCarts.remove(caller);
  };

  public shared ({ caller }) func checkout() : async Text {
    if (not isAdmin(caller) and not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can checkout");
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
                          { v with inventory = if (v.inventory >= item.quantity) { v.inventory - item.quantity } else { v.inventory } };
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
              inventory = if (product.inventory >= item.quantity) { product.inventory - item.quantity } else { product.inventory };
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

    let order = createOrder(caller, items, orderId);

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

  func createOrder(customer : Customer, items : [OrderItem], orderId : Text) : Order {
    let processedItems = items.map(
      func(item) {
        let price = getItemPrice(item.productId, item.variantId);
        {
          productId = item.productId;
          variantId = item.variantId;
          quantity = item.quantity;
          price;
        };
      }
    );

    let total = processedItems.foldLeft(
      0,
      func(acc, item) { acc + (item.price * item.quantity) },
    );

    let order : Order = {
      id = orderId;
      customer;
      items = processedItems;
      total;
      status = #pending;
      date = Time.now();
    };

    order;
  };

  func getItemPrice(productId : Text, variantId : ?Text) : Nat {
    switch (products.get(productId)) {
      case (null) {
        Runtime.trap("Product not found: " # productId);
      };
      case (?product) {
        switch (variantId) {
          case (null) {
            product.price;
          };
          case (?variantId) {
            switch (product.variants) {
              case (null) {
                Runtime.trap("No variants found for product: " # productId);
              };
              case (?variants) {
                let variantOpt = variants.find(func(v) { v.id == variantId });
                switch (variantOpt) {
                  case (null) {
                    Runtime.trap("Variant not found for product: " # productId);
                  };
                  case (?variant) {
                    variant.price;
                  };
                };
              };
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func getProductVariants(productId : Text) : async ?[ProductVariant] {
    switch (products.get(productId)) {
      case null { null };
      case (?product) { product.variants };
    };
  };

  public query ({ caller }) func getUnreadNotifications() : async [Notification] {
    if (not isAdmin(caller) and not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view notifications");
    };

    let unread = notifications.values().filter(
      func(n) {
        n.recipient == caller and not n.read;
      }
    );
    unread.toArray();
  };

  public shared ({ caller }) func markNotificationAsRead(notificationId : Text) : async () {
    if (not isAdmin(caller) and not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can mark notifications as read");
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

  public shared ({ caller }) func submitReview(productId : Text, rating : Nat, reviewText : Text, variantId : ?Text) : async () {
    if (not isAdmin(caller) and not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can submit reviews");
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
      null;
    } else {
      ?caller;
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
    requireAdmin(caller);

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
        totalRevenue += item.price * item.quantity;
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
