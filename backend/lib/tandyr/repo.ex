defmodule Tandyr.Repo do
  use Ecto.Repo,
    otp_app: :tandyr,
    adapter: Ecto.Adapters.Postgres
end
