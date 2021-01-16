defmodule TandyrWeb.RoomChannel do
  @moduledoc """
  Channel handles all communications in chat room
  """
  use Phoenix.Channel

  require Logger

  @impl true
  def join("room:" <> room_id, _payload, socket) do
    case Tandyr.Messaging.can_join_conversation(socket.assigns.user_id, room_id) do
      :not_found -> {:error, "User not allowed to join this room"}
      conversation -> {:ok, conversation, socket}
    end
  end

  @impl true
  def handle_in("new_message", %{"body" => body}, socket) do
    room_id = room_id(socket.topic)

    case Tandyr.Messaging.new_message(socket.assigns.user_id, room_id, %{body: body}) do
      {:ok, message} ->
        broadcast!(socket, "new_message", message)
        {:reply, {:ok, message}, socket}

      {:error, error} ->
        {:reply, {:error, error}, socket}
    end
  end

  def handle_in("invite", %{"users" => user_ids}, socket) do
    room_id = room_id(socket.topic)

    case Tandyr.Messaging.invite_users(room_id, user_ids) do
      {:ok, {conversation, new_users}} ->
        new_users
        |> Enum.each(fn u ->
          TandyrWeb.Endpoint.broadcast_from!(self(), "direct:#{u.id}", "invite", %{
            to_room: conversation.id
          })
        end)

        {:reply, {:ok, %{}}, socket}

      {:error, error} ->
        {:reply, {:error, error}, socket}
    end
  end

  defp room_id("room:" <> room_id) do
    {room_id, _remain} = Integer.parse(room_id)
    room_id
  end
end
