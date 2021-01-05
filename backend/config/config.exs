# This file is responsible for configuring your application
# and its dependencies with the aid of the Mix.Config module.
#
# This configuration file is loaded before any dependency and
# is restricted to this project.

# General application configuration
use Mix.Config

config :tandyr,
  ecto_repos: [Tandyr.Repo]

config :tandyr, Tandyr.UserManager.Guardian,
  issuer: "tandyr",
  secret_key: "IsSKp1vvRM3GxVeE2NN2f/ND3A6Eh6IRgSc+SlSFBd2WemyFKY/I6fYqLTdne3vi" # put the result of the mix command above here

# Configures the endpoint
config :tandyr, TandyrWeb.Endpoint,
  url: [host: "localhost"],
  secret_key_base: "mTwHJB4wokRj8wQ3abG68M8ExeOGoSnEWhv+Yv+wEwAqnDWf2y5OkEWtnajeaSGy",
  render_errors: [view: TandyrWeb.ErrorView, accepts: ~w(json), layout: false],
  pubsub_server: Tandyr.PubSub,
  live_view: [signing_salt: "VmAqZT63"]

# Configures Elixir's Logger
config :logger, :console,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id]

# Use Jason for JSON parsing in Phoenix
config :phoenix, :json_library, Jason

# Import environment specific config. This must remain at the bottom
# of this file so it overrides the configuration defined above.
import_config "#{Mix.env()}.exs"
