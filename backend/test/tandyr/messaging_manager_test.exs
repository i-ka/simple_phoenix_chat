defmodule Tandyr.MessagingTest do
  use Tandyr.DataCase



  @test_user_data %{password: "some password", username: "some_username"}

  describe "message" do
    alias Tandyr.UserManager
    alias Tandyr.Messaging

    def user_fixture(attrs) do
      {:ok, user} =
        attrs
        |> Enum.into(@test_user_data)
        |> UserManager.create_user()

      user
    end

  test "new_conversation/3 creates conversation with proper users" do
    start_user = user_fixture(%{username: "start_user"})
    invite_user = user_fixture(%{username: "invite_user"})

    assert {:ok, _} = Messaging.new_conversation(start_user.id, "test_conv", [invite_user.id])
  end

  end
end
