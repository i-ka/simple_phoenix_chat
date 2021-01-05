defmodule Tandyr.Messaging.Message do
  use Ecto.Schema
  import Ecto.Changeset

  @derive {Jason.Encoder, only: [:id, :content, :author_id, :conversation_id, :updated_at, :inserted_at]}

  schema "messages" do
    field :content, :map

    belongs_to :author, Tandyr.UserManager.User
    belongs_to :conversation, Tandyr.Messaging.Conversation

    timestamps()
  end

  def changeset(message, attrs) do
    message
    |> cast(attrs, [:content, :author, :conversation])
    |> validate_required([:convent, :author, :conversation])
  end
end
