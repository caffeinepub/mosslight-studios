import Principal "mo:core/Principal";

module {
  type OldActor = {
    HARD_CODED_ADMIN_PRINCIPAL : Principal;
  };

  type NewActor = {
    adminPrincipal : ?Principal;
  };

  public func run(old : OldActor) : NewActor {
    {
      adminPrincipal = null;
    };
  };
};
