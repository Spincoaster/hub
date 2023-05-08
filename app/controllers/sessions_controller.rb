class SessionsController < ApplicationController
  def new
  end

  def create
    admin = Admin.find_by(name: params[:name].downcase)
    if admin && admin.authenticate(params[:password])
      login(admin)
      redirect_to top_path
    else
      flash.now[:danger] = 'Invalid name/password combination'
      render 'new'
    end
  end

  def destroy
    logout
    redirect_to login_path
  end
end
