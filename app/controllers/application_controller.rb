class ApplicationController < ActionController::Base
  before_action :set_menus

  def set_menus
    @navigation_menus = [
      { href: "/", icon: "home", label:"Top" },
      { href: "/features", icon: "collections_bookmark", label: "Feature" },
      { href: "/artists?has_prefix=a", icon: "assignment_ind", label:"Artists" },
      { href: "/records?has_prefix=a", icon: "album", label:"Records" },
      { href: "/tracks?has_prefix=a" , icon: "high_quality", label: "Hi-Res" },
      { href: "/owners" , icon: "perm_identity", label: "Owners" }
    ]
  end
end
