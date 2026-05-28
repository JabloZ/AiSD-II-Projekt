namespace krasnoludki.Api;

using Npgsql;
using Dapper;

public static class DatasetEndpoints
{
    public static void MapDatasetEndpoints(this WebApplication app, string connStr)
    {
        NpgsqlConnection PublicDb() => new NpgsqlConnection(connStr);

        // ── GET /api/datasets — lista zbiorów ─────────────────────────────────
        app.MapGet("/api/datasets", async () =>
        {
            using var db = PublicDb();
            var datasets = (await db.QueryAsync("SELECT name, label FROM public.datasets ORDER BY created_at")).ToList();
            return Results.Ok(new
            {
                datasets = datasets.Select(d => new { name = (string)d.name, label = (string)d.label }),
                active   = Globals.ActualDataset,
            });
        });

        // ── POST /api/datasets — nowy zbiór ───────────────────────────────────
        app.MapPost("/api/datasets", async (CreateDatasetDto dto) =>
        {
            using var db = PublicDb();
            await db.OpenAsync();
            var count      = await db.ExecuteScalarAsync<long>("SELECT COUNT(*) FROM public.datasets");
            var schemaName = $"zbior{count + 1}";
            await db.ExecuteAsync("SELECT public.create_dataset(@schema, @label)",
                new { schema = schemaName, label = dto.Label ?? schemaName });
            return Results.Ok(new { name = schemaName, label = dto.Label ?? schemaName });
        });

        // ── DELETE /api/datasets/{name} — usuń zbiór ──────────────────────────
        app.MapDelete("/api/datasets/{name}", async (string name) =>
        {
            if (name == Globals.ActualDataset)
                return Results.BadRequest("Nie można usunąć aktywnego zbioru danych.");
            using var db = PublicDb();
            await db.OpenAsync();
            var count = await db.ExecuteScalarAsync<long>("SELECT COUNT(*) FROM public.datasets");
            if (count <= 1)
                return Results.BadRequest("Nie można usunąć jedynego zbioru danych.");
            await db.ExecuteAsync($"DROP SCHEMA IF EXISTS \"{name}\" CASCADE");
            await db.ExecuteAsync("DELETE FROM public.datasets WHERE name = @name", new { name });
            return Results.Ok();
        });

        // ── PUT /api/datasets/{name}/activate — przełącz aktywny zbiór ────────
        app.MapPut("/api/datasets/{name}/activate", async (string name) =>
        {
            using var db = PublicDb();
            var exists = await db.ExecuteScalarAsync<long>(
                "SELECT COUNT(*) FROM public.datasets WHERE name = @name", new { name });
            if (exists == 0)
                return Results.NotFound($"Zbiór '{name}' nie istnieje.");
            Globals.ActualDataset = name;
            return Results.Ok(new { active = name });
        });
    }
}
