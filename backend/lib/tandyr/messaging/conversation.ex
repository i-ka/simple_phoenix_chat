defmodule Tandyr.Messaging.Conversation do
  use Ecto.Schema
  import Ecto.Changeset

  @derive {Jason.Encoder, only: [:id, :name, :description, :participants, :messages, :updated_at, :inserted_at]}

  schema "conversations" do
    field :name, :string
    field :description, :string

    has_many :messages, Tandyr.Messaging.Message
    many_to_many :participants, Tandyr.UserManager.User, join_through: "conversations_users"

    timestamps()
  end

  def changeset(conversation, attrs) do
    conversation
    |> cast(attrs, [:name])
    |> validate_required([:name])
  end
end
