import Map "mo:core/Map";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Storage "blob-storage/Storage";

module {
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
    taxRate : Float;
    shippingPrice : Float;
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

  public type OldActor = {
    products : Map.Map<Text, Product>;
  };

  public type NewActor = {
    products : Map.Map<Text, Product>;
    portfolioItems : Map.Map<Text, PortfolioItem>;
    galleryItems : Map.Map<Text, GalleryItem>;
    blogPosts : Map.Map<Text, BlogPost>;
    comments : Map.Map<Text, Comment>;
  };

  public func run(old : OldActor) : NewActor {
    let portfolioItems = Map.empty<Text, PortfolioItem>();
    let galleryItems = Map.empty<Text, GalleryItem>();
    let blogPosts = Map.empty<Text, BlogPost>();
    let comments = Map.empty<Text, Comment>();
    {
      old with
      portfolioItems;
      galleryItems;
      blogPosts;
      comments;
    };
  };
};
