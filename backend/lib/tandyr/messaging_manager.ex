defmodule Tandyr.Messaging do
  require Logger
  import Ecto.Query, warn: false
  alias Tandyr.Repo
  alias Tandyr.Messaging.Conversation
  alias Tandyr.Messaging.Message
  alias Tandyr.UserManager

  def new_message(attrs \\ %{}) do
    %Message{} |> Message.changeset(attrs) |> Repo.insert!()
  end

  @spec new_conversation(integer(), String.t(), [integer()]) :: any
  def new_conversation(creating_user_id, name, users_to_invite) do
    with user when not is_nil(user) <- UserManager.get_user(creating_user_id),
         participants when length(participants) != 0 <-
           users_to_invite
           |> Enum.map(&UserManager.get_user(&1))
           |> Enum.filter(fn u -> not is_nil(u) end),
         {:ok, conversation} <-
           %Conversation{}
           |> Conversation.changeset(%{name: name})
           |> Ecto.Changeset.put_assoc(:participants, participants |> Enum.concat([user]))
           |> Repo.insert() do
      { :ok, conversation }
    else
      {:error, _changeset} -> {:error, "Failed to create conversation"}
      _ -> {:error, "Failed to create conversation"}
    end
  end
end
