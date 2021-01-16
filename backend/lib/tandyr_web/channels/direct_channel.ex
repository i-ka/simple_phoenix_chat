defmodule TandyrWeb.DirectChannel do
  use TandyrWeb, :channel

  require Logger

  def join("direct:" <> user_id, _payload, socket) do
    {user_id, _remain} = Integer.parse(user_id)

    if socket.assigns.user_id == user_id do
      {:ok, %{}, socket}
    else
      {:error, "Unathorized"}
    end
  end

  def handle_in(
        "new_conversation",
        %{"name" => conv_name, "users_to_invite" => invite_users},
        socket
      ) do
    case Tandyr.Messaging.new_conversation(socket.assigns.user_id, conv_name, invite_users) do
      {:ok, conversation} ->
        conversation.participants
        |> Enum.each(fn u ->
          TandyrWeb.Endpoint.broadcast_from!(self(), "direct:#{u.id}", "invite", %{
            to_room: conversation.id
          })
        end)

        {:reply,
         {:ok,
          conversation |> Map.take([:id, :name, :description, :inserted_at, :updated_at])},
         socket}

      _ ->
        {:reply, {:error, %{error: "Unknown"}}, socket}
    end
  end

  def handle_in("get_my_rooms", _, socket) do
    result =
      Tandyr.Messaging.get_user_conversations(socket.assigns.user_id)
      |> Enum.map(fn room ->
        Map.take(room, [:id, :name, :description, :inserted_at, :updated_at])
      end)

    {:reply, {:ok, result}, socket}
  end
end
