class ApplicationController < ActionController::Base
  before_action :set_menus

  def set_menus
    @navigation_menus = [
      { href: "/", icon: "home", label:"Top" },
      { href: "/features", icon: "collections_bookmark", label: "Feature" },
      { href: "/artists?has_prefix=a", icon: "assignment_ind", label:"Artists" },
      { href: "/records?has_prefix=a", icon: "album", label:"Records" },
      { href: "/tracks?has_prefix=a" , icon: "high_quality", label: "Hi-Res" },
      { href: "/owners", icon: "perm_identity", label: "Owners" }
    ]
    @navigation_menus.push({ href: "/logout", icon: "undo", label: "Logout" }) if logged_in?
  end

  def login(admin)
    session[:admin_id] = admin.id
  end

  def logout
    session[:admin_id] = nil
  end

  def current_admin
    return @current_admin if @current_admin.present?
    if session[:admin_id]
      @current_admin = Admin.find_by(id: session[:admin_id])
    end
    @current_admin
  end

  def logged_in?
    current_admin.present?
  end

  def require_admin
    if current_admin.blank?
      flash[:error] = "You must be logged in to access this page"
      redirect_to login_path
    end
  end

end
