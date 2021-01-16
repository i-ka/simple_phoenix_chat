defmodule Tandyr.Messaging.Message do
  use Ecto.Schema
  import Ecto.Changeset

  @derive {Jason.Encoder,
           only: [
             :id,
             :content,
             :user_id,
             :user,
             :conversation_id,
             :updated_at,
             :inserted_at
           ]}

  schema "messages" do
    field(:content, :map)

    belongs_to(:user, Tandyr.UserManager.User)
    belongs_to(:conversation, Tandyr.Messaging.Conversation)

    timestamps()
  end

  def changeset(message, attrs) do
    message
    |> cast(attrs, [:content])
    |> validate_required([:content])
  end
end
