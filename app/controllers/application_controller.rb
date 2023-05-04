class ApplicationController < ActionController::Base
  before_action :set_menus

  def set_menus
    @bar = params[:bar]
    @bars = %w[shinjuku ebisu]
    @navigation_menus = []
    case @bar
    when "shinjuku"
      @navigation_menus += [
        { href: "/#{@bar}", icon: "home", label:"Top" },
        { href: "/#{@bar}/features", icon: "collections_bookmark", label: "Feature" },
        { href: "/#{@bar}/artists?has_prefix=a", icon: "assignment_ind", label:"Artists" },
        { href: "/#{@bar}/records?has_prefix=a", icon: "album", label: "Records" },
        { href: "/tracks?has_prefix=a" , icon: "high_quality", label: "Hi-Res" },
      ]
    when "ebisu"
      @navigation_menus += [
        { href: "/#{@bar}", icon: "home", label:"Top" },
        { href: "/#{@bar}/artists?has_prefix=a", icon: "assignment_ind", label:"Artists" },
        { href: "/#{@bar}/records?has_prefix=a", icon: "album", label: "Records" },
      ]
    else
      @navigation_menus += [
        { href: "/shinjuku", icon: nil, label: 'SHINJUKU' },
        { href: "/ebisu", icon: nil, label: 'EBISU' },
      ]
    end
    @navigation_menus << { href: "/logout", icon: "undo", label: "Logout" } if logged_in?
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
