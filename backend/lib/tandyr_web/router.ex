defmodule TandyrWeb.Router do
  use TandyrWeb, :router

  pipeline :auth do
    plug Tandyr.UserManager.Pipeline
  end

  # We use ensure_auth to fail if there is no one logged in
  pipeline :ensure_auth do
    plug Guardian.Plug.EnsureAuthenticated
  end

  pipeline :api do
    plug :accepts, ["json"]
    # plug CORSPlug, origin: "http://localhost:3000"
  end

  scope "/api", TandyrWeb do
    pipe_through [:api, :auth]

    get  "/user/:user_id", UserController, :get_user_by_id
    post "/user/register", UserController, :register
    post "/user/login", UserController, :login

    post "/user/test", UserController, :test
  end

  scope "/api", TandyrWeb do
    pipe_through [:api, :auth, :ensure_auth]

    get "/me", UserController, :get_me
  end

  # Enables LiveDashboard only for development
  #
  # If you want to use the LiveDashboard in production, you should put
  # it behind authentication and allow only admins to access it.
  # If your application does not have an admins-only section yet,
  # you can use Plug.BasicAuth to set up some basic authentication
  # as long as you are also using SSL (which you should anyway).
  if Mix.env() in [:dev, :test] do
    import Phoenix.LiveDashboard.Router

    scope "/" do
      pipe_through [:fetch_session, :protect_from_forgery]
      live_dashboard "/dashboard", metrics: TandyrWeb.Telemetry
    end
  end
end
