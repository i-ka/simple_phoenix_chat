defmodule Tandyr.Messaging do
  require Logger
  import Ecto.Query, warn: false
  alias Tandyr.Repo
  alias Tandyr.Messaging.Conversation
  alias Tandyr.Messaging.Message
  alias Tandyr.UserManager

  def can_join_conversation(user_id, conversation_id)do
    # todo return room
    user_id = try_parse_int(user_id)
    conversation_id = try_parse_int(conversation_id)
    from(cu in "conversations_users",
      where: cu.conversation_id == ^conversation_id and cu.user_id == ^user_id
    )
    |> Repo.exists?()
  end

  defp try_parse_int(value) when is_binary(value) do
    with {res, _} <- Integer.parse(value) do
      res
    end
  end

  defp try_parse_int(value) when is_integer(value) do
    value
  end

  def get_user_conversations(user_id) do
    from(room in Conversation,
      left_join: cu in "conversations_users",
      on: cu.conversation_id == room.id,
      left_join: m in Message,
      on: m.conversation_id == room.id,
      where: cu.user_id == ^user_id,
      preload: [:messages, :participants]
    )
    |> Repo.all()
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
      {:ok, conversation}
    else
      {:error, _changeset} -> {:error, "Failed to create conversation"}
      _ -> {:error, "Failed to create conversation"}
    end
  end

  def new_message(from_user, conversation_id, %{"body" => message_body}) do
    with conversation when not is_nil(conversation) <- Repo.get(Conversation, conversation_id),
         {:ok, message} <-
           %Message{}
           |> Message.changeset(%{content: %{body: message_body}})
           |> Ecto.Changeset.put_assoc(:autor, from_user)
           |> Ecto.Changeset.put_assoc(:conversation, conversation)
           |> Repo.insert() do
      {:ok, message}
    else
      nil ->
        {:error, "Conversation not found"}

      unknown ->
        Logger.info("Some unknown error happens when creating #{inspect(unknown)}")
        {:error, "Unknown error on message send"}
    end
  end
end
