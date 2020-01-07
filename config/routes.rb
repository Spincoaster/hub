Rails.application.routes.draw do
  get 'sessions/new'
  root 'top#index'

  get    '/top',     to: 'top#index'
  get    '/login',   to: 'sessions#new'
  post   '/login',   to: 'sessions#create'
  get    '/logout',  to: 'sessions#destroy'

  resources :artists, only: [:index, :show]
  resources :tracks, only: [:index]
  resources :owners, only: [:index]
  resources :records, only: [:index]
  resources :features
  resources :feature_items, only: [:create, :destroy]

  get '/search', to: 'search#index'
end
