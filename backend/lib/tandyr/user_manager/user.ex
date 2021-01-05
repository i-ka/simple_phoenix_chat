defmodule Tandyr.UserManager.User do
  use Ecto.Schema
  import Ecto.Changeset
  require Argon2

  @derive {Jason.Encoder, only: [:id, :username, :updated_at, :inserted_at]}

  schema "users" do
    field :password, :string
    field :username, :string

    many_to_many :conversations, Tandyr.Messaging.Conversation, join_through: "conversations_users"

    timestamps()
  end

  @doc false
  def changeset(user, attrs) do
    user
    |> cast(attrs, [:username, :password])
    |> validate_required([:username, :password])
    |> unique_constraint(:username)
    |> put_password_hash()
  end

  defp put_password_hash(%Ecto.Changeset{valid?: true, changes: %{password: password}} = changeset) do
    change(changeset, password: Argon2.hash_pwd_salt(password))
  end
  defp put_password_hash(changeset), do: changeset
end
