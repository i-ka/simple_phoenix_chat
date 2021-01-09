defmodule TandyrWeb.RoomChannel do
  use Phoenix.Channel

  require Logger

  @impl true
  def join("room:" <> room_id, _payload, socket) do
    if Tandyr.Messaging.can_join_conversation(socket.assigns.user_id, room_id) do
      {:ok, socket}
    else
      {:error, socket}
    end
  end

  @impl true
  def handle_in("new_message", %{"body" => body}, socket) do
    "room:"<> room_id = socket.topic
    with {:ok, message} <- Tandyr.Messaging.new_message(socket.assigns.user_id, room_id, %{body: body}) do
      broadcast!(socket, "new_message", message)
      {:reply, {:ok, message}, socket}
    else
      {:error, error} -> {:reply, {:error, error}, socket}
    end
  end

end
