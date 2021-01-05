defmodule TandyrWeb.DirectChannel do
  use TandyrWeb, :channel

  def join("direct:" <> user_id, _payload, socket) do
    if socket.assigns.user_id == user_id do
      {:ok, %{}, socket}
    else
      {:ok, %{error: "Unathorized"}, socket}
    end
  end

  def handle_in(
        "new_conversation",
        %{"name" => conv_name, "users_to_invite" => invite_users},
        socket
      ) do
    with {:ok, conversation} <-
           Tandyr.Messaging.new_conversation(socket.assigns.user_id, conv_name, invite_users) do
      conversation.participants
      |> Enum.each(fn u ->
        broadcast(socket, "direct:#{u.id}:invite", %{to_room: conversation.id})
      end)

      {:reply, {:ok, conversation}, socket}
    else
      _ -> {:reply, {:error, %{error: "Unknown"}}, socket}
    end
  end
end
