defmodule Tandyr.UserManager.Guardian do
  use Guardian, otp_app: :tandyr
  require Logger
  alias Tandyr.UserManager

  def subject_for_token(user, _claims) do
    {:ok, to_string(user.id)}
  end

  def resource_from_claims(%{"sub" => id}) do
    Logger.debug("Searching for user with id #{id}")
    with user when not is_nil(user) <- UserManager.get_user(id) do
      Logger.debug("Found user #{inspect(user)}")
      {:ok, user}
    else
      nil ->
        Logger.debug("User not found")
        {:error, :resource_not_found}
    end
  end
end
