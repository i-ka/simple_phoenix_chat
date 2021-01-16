defmodule TandyrWeb.UserController do
  use TandyrWeb, :controller

  alias Tandyr.{UserManager, UserManager.User, UserManager.Guardian}
  require Logger

  def login(conn, %{"username" => username, "password" => password}) do
    with {:ok, user} <- UserManager.authenticate_user(username, password),
         {:ok, token, _} <- Guardian.encode_and_sign(user) do
      json(conn, %{me: user, token: token})
    else
      {:error, reason} -> conn |> put_status(400) |> json(%{error: reason})
    end
  end

  def register(conn, %{"username" => username, "password" => password}) do
    with {:ok, user} <- UserManager.create_user(%{username: username, password: password}),
         {:ok, token, _} <- Guardian.encode_and_sign(user) do
      conn |> put_status(202) |> json(%{me: user, token: token})
    else
      {:error, %Ecto.Changeset{errors: errors}} ->
        conn
        |> put_status(403)
        |> json(%{
          errors: errors |> Enum.map(fn {field, {desc, _}} -> %{field: field, error: desc} end)
        })
    end
  end

  def get_user_by_id(conn, %{"user_id" => user_id}) do
    case UserManager.get_user(user_id) do
      user when not is_nil(user) ->
        conn |> put_status(200) |> json(user)

      nil ->
        conn |> put_status(404) |> text('')
    end
  end

  def get_me(conn, _) do
    case Guardian.Plug.current_resource(conn) do
      user when not is_nil(user) -> conn |> json(user)
      _ -> conn |> put_status(403) |> text('')
    end
  end
end
