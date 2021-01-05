defmodule TandyrWeb.RoomChannel do
  use Phoenix.Channel

  require Logger

  @impl true
  def join("room" <> _room_id, _payload, socket) do
    #Logger.info("User #{socket.assigns.user_id} joined to room #{room_id}")
    {:ok, socket}
  end

  @impl true
  def handle_in("new_msg", %{"uid" => uid, "body" => body}, socket) do
    broadcast!(socket, "new_msg", %{uid: uid, body: body})
    {:noreply, socket}
  end

end
