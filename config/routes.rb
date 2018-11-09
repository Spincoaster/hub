Rails.application.routes.draw do
  root 'top#index'

  resources :artists, only: [:index, :show]
  resources :tracks, only: [:index]
  resources :owners, only: [:index]
  resources :records, only: [:index]

  get '/search', to: 'search#index'
end
