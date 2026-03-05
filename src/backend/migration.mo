import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Storage "blob-storage/Storage";

module {
  type OldGalleryItem = {
    id : Text;
    title : Text;
    description : Text;
    image : Storage.ExternalBlob;
    createdAt : Time.Time;
  };

  type OldActor = {
    galleryItems : Map.Map<Text, OldGalleryItem>;
  };

  type NewGalleryItem = {
    id : Text;
    title : Text;
    description : Text;
    image : Storage.ExternalBlob;
    createdAt : Time.Time;
    taggedProductIds : [Text];
  };

  type NewActor = {
    galleryItems : Map.Map<Text, NewGalleryItem>;
  };

  public func run(old : OldActor) : NewActor {
    let newGalleryItems = old.galleryItems.map<Text, OldGalleryItem, NewGalleryItem>(
      func(_id, oldGalleryItem) {
        { oldGalleryItem with taggedProductIds = [] };
      }
    );
    { galleryItems = newGalleryItems };
  };
};
