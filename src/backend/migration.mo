import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";

module {
  type OldProductVariant = {
    id : Text;
    size : Text;
    color : Text;
    inventory : Nat;
    parentProductId : Text;
  };

  type OldProduct = {
    id : Text;
    name : Text;
    description : Text;
    price : Nat;
    images : [Blob];
    inventory : Nat;
    variants : ?[OldProductVariant];
    hasVariants : Bool;
  };

  type OldActor = {
    products : Map.Map<Text, OldProduct>;
  };

  type NewProductVariant = {
    id : Text;
    size : Text;
    color : Text;
    price : Nat;
    inventory : Nat;
    parentProductId : Text;
  };

  type NewProduct = {
    id : Text;
    name : Text;
    description : Text;
    price : Nat;
    images : [Blob];
    inventory : Nat;
    variants : ?[NewProductVariant];
    hasVariants : Bool;
  };

  type NewActor = {
    products : Map.Map<Text, NewProduct>;
  };

  public func run(old : OldActor) : NewActor {
    let newProducts = old.products.map<Text, OldProduct, NewProduct>(
      func(_id, oldProduct) {
        {
          oldProduct with
          variants = oldProduct.variants.map(
            func(oldVariants) {
              oldVariants.map(
                func(oldVariant) {
                  {
                    oldVariant with
                    price = 0; // Default price for existing variants
                  };
                }
              );
            }
          );
        };
      }
    );
    { products = newProducts };
  };
};
