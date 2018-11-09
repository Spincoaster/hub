Rails.application.routes.draw do
  get 'top/index'
  root 'top#index'

  resources :artists, only: [:index, :show]
  resources :tracks, only: [:index]
  resources :owners, only: [:index]
  resources :records, only: [:index]
end
