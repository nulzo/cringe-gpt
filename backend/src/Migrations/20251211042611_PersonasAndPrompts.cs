using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OllamaWebuiBackend.Migrations
{
    /// <inheritdoc />
    public partial class PersonasAndPrompts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "Prompts",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "VariablesJson",
                table: "Prompts",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Prompts_UserId",
                table: "Prompts",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Prompts_AspNetUsers_UserId",
                table: "Prompts",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Prompts_AspNetUsers_UserId",
                table: "Prompts");

            migrationBuilder.DropIndex(
                name: "IX_Prompts_UserId",
                table: "Prompts");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Prompts");

            migrationBuilder.DropColumn(
                name: "VariablesJson",
                table: "Prompts");
        }
    }
}
