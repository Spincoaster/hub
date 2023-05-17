Rails.application.routes.draw do
  get 'sessions/new'
  root 'top#index'

  get    '/top',     to: 'top#index'
  get    '/login',   to: 'sessions#new'
  post   '/login',   to: 'sessions#create'
  get    '/logout',  to: 'sessions#destroy'

  get '/search', to: 'search#index'
  get '/:bar', to: 'top#show'

  scope '/(:bar)' do
    resources :artists
    resources :tracks, except: [:show]
    resources :albums, except: [:show]
    resources :owners, except: [:show]
    resources :records, except: [:show]
    resources :features
    resources :feature_items, only: [:create, :destroy]

    get '/search', to: 'search#index'
    get '/search_artists', to: 'search#artists'
    get '/search_albums', to: 'search#albums'
  end
end
