defmodule Tandyr.Messaging do
  require Logger
  import Ecto.Query, warn: false
  alias Tandyr.Repo
  alias Tandyr.Messaging.Conversation
  alias Tandyr.Messaging.Message
  alias Tandyr.UserManager.User
  alias Tandyr.UserManager

  def can_join_conversation(user_id, conversation_id) do
    user_id = try_parse_int(user_id)
    conversation_id = try_parse_int(conversation_id)

    in_conversation_query =
      from(cu in "conversations_users",
        where: cu.conversation_id == ^conversation_id and cu.user_id == ^user_id
      )

    if Repo.exists?(in_conversation_query) do
      from(c in Conversation,
        left_join: cu in "conversations_users",
        on: c.id == cu.conversation_id,
        left_join: u in User,
        on: u.id == cu.user_id,
        left_join: m in Message,
        on: m.conversation_id == c.id,
        left_join: a in User,
        on: a.id == m.user_id,
        where: c.id == ^conversation_id,
        preload: [messages: {m, user: a}, participants: u]
      )
      |> Repo.one()
    else
      :not_found
    end
  end

  def get_user_conversations(user_id) do
    from(room in Conversation,
      left_join: cu in "conversations_users",
      on: cu.conversation_id == room.id,
      where: cu.user_id == ^user_id,
      select: room
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

  def invite_users(conversation_id, user_ids) do
    with conversation when not is_nil(conversation) <-
           Repo.one(
             from(c in Conversation, where: c.id == ^conversation_id, preload: [:participants])
           ),
         participants when length(participants) != 0 <- user_ids |> get_users(),
         {:ok, conversation} <-
           conversation
           |> Ecto.Changeset.put_assoc(
             :participants,
             Enum.concat([conversation.participants, participants])
           )
           |> Repo.update() do
      {:ok, {conversation, participants}}
    else
      nil ->
        {:error, "Conversation not found"}

      [] ->
        {:error, "No users found"}

      {:error, error} ->
        Logger.error("Error on update conversation, #{inspect(error)}")
        {:error, "cannot update conversation"}
    end
  end

  def new_message(user_id, conversation_id, %{body: message_body}) do
    with conversation when not is_nil(conversation) <- Repo.get(Conversation, conversation_id),
         from_user when not is_nil(from_user) <- UserManager.get_user(user_id),
         {:ok, message} <-
           %Message{}
           |> Message.changeset(%{content: %{body: message_body}})
           |> Ecto.Changeset.put_assoc(:user, from_user)
           |> Ecto.Changeset.put_assoc(:conversation, conversation)
           |> Repo.insert() do
      {:ok, message}
    else
      nil ->
        {:error, "Conversation not found"}

      unknown ->
        Logger.info("Some unknown error happens when creating message #{inspect(unknown)}")
        {:error, "Unknown error on message send"}
    end
  end

  defp get_users(user_ids) do
    user_ids
    |> Enum.map(&UserManager.get_user(&1))
    |> Enum.filter(fn u -> not is_nil(u) end)
  end

  defp try_parse_int(value) when is_binary(value) do
    with {res, _} <- Integer.parse(value) do
      res
    end
  end

  defp try_parse_int(value) when is_integer(value) do
    value
  end
end
