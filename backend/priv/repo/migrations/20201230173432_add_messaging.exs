defmodule Tandyr.Repo.Migrations.AddMessaging do
  use Ecto.Migration

  def change do

    create table("conversations") do
      add :name, :string
      add :description, :string

      timestamps()
    end

    create table("conversations_users") do
      add :conversation_id, references("conversations")
      add :user_id, references("users")
    end

    create table("messages") do
      add :content, :map
      add :user_id, references("users")
      add :conversation_id, references("conversations")

      timestamps()
    end

  end
end
