Rails.application.routes.draw do
  get 'top/index'
  root 'top#index'

  resources :artists, only: [:index]
  resources :tracks, only: [:index]
end
