using krasnoludki;
using krasnoludki.Algorithms;
using krasnoludki.Entities;
using krasnoludki.Repositories;
using System.Text.Json;
using Npgsql;
using Dapper;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();
app.UseCors();

// ── DB ────────────────────────────────────────────────────────────────────────
var connStr = Environment.GetEnvironmentVariable("CONNECTION_STRING") ?? "";
async Task<NpgsqlConnection> Db() {
    var conn = new NpgsqlConnection(connStr);
    await conn.OpenAsync();
    await conn.ExecuteAsync($"SET search_path TO \"{Globals.ActualDataset}\"");
    return conn;
}
NpgsqlConnection PublicDb() => new NpgsqlConnection(connStr);

// ── GET /api/data — wszystkie dane z relacyjnych tabel ────────────────────────
app.MapGet("/api/data", async () =>
{
    var repo = new MainRepository();
    var (dwarfs, houses, deposits) = await repo.GetDataSetupFromDB();

    using var db = await Db();
    var minerals = (await db.QueryAsync<MineralRow>("SELECT Id, Name FROM Minerals ORDER BY Id")).ToList();
    var mineralNameById = minerals.ToDictionary(m => m.Id, m => m.Name);

    var borderJson = await db.QueryFirstOrDefaultAsync<string>(
        "SELECT Value::text FROM Config WHERE Key = 'border'") ?? "[]";
    var border = JsonDocument.Parse(borderJson).RootElement;

    return Results.Ok(new
    {
        border,
        houses   = houses.Select(h => new { id = h.Id, x = h.X, y = h.Y }),
        dwarfs   = dwarfs.Select(d => new {
            id          = d.Id,
            name        = d.Name,
            houseId     = d.HouseId,
            preferences = d.preferences ?? new Dictionary<int, float>(),
        }),
        deposits = deposits.Select(d => new {
            id          = d.Id,
            mineralId   = d.MineralId,
            mineralName = mineralNameById.GetValueOrDefault(d.MineralId, "?"),
            capacity    = d.Capacity,
            x           = d.X,
            y           = d.Y,
        }),
        minerals = minerals.Select(m => new { id = m.Id, name = m.Name }),
    });
});

// ── GET /api/assign-from-db — uruchamia algorytm na danych z DB ───────────────
app.MapGet("/api/assign-from-db", async (string? algorithm) =>
{
    var repo = new MainRepository();
    var (dwarfs, _, deposits) = await repo.GetDataSetupFromDB();

    var solver = new AssignmentSolver();
    solver.SolveAssignments(dwarfs, deposits, algorithm ?? "mcmf");

    var assignments = dwarfs
        .Where(d => d.DepositAssigned && d.Deposit != null)
        .GroupBy(d => new { HouseId = d.HouseId, DepositId = d.Deposit!.Id })
        .Select(g =>
        {
            var sample = g.First();
            var dist   = Math.Sqrt(
                Math.Pow(sample.House!.X - sample.Deposit!.X, 2) +
                Math.Pow(sample.House!.Y  - sample.Deposit!.Y, 2));
            return new AssignmentDto(
                g.Key.HouseId.ToString(),
                g.Key.DepositId.ToString(),
                g.Count(), dist);
        })
        .ToList();

    double totalDist = assignments.Sum(a => a.Count * a.Distance);
    return Results.Ok(new AssignResultDto(assignments, solver.Logs, totalDist));
});

// ── PUT /api/setup — zapisuje cały zestaw danych do relacyjnych tabel ─────────
app.MapPut("/api/setup", async (SetupBodyDto dto) =>
{
    using var db = await Db();
    using var tx = db.BeginTransaction();

    try
    {
        // Wyczyść wszystkie tabele i zresetuj sekwencje
        await db.ExecuteAsync(
            "TRUNCATE Preferences, Dwarfs, Deposits, Houses, Minerals RESTART IDENTITY",
            transaction: tx);

        // Zbierz unikalne nazwy minerałów z kopalni i preferencji
        var allMineralNames = dto.Mines
            .Select(m => m.Mineral ?? m.MineralType ?? "")
            .Concat(dto.Houses.SelectMany(h => h.Dwarfs.SelectMany(d => d.MineralPreferences)))
            .Where(n => !string.IsNullOrWhiteSpace(n))
            .Distinct()
            .ToList();

        // Wstaw minerały
        var mineralIdByName = new Dictionary<string, int>();
        foreach (var name in allMineralNames)
        {
            var id = await db.ExecuteScalarAsync<int>(
                "INSERT INTO Minerals (Name) VALUES (@name) RETURNING Id",
                new { name }, tx);
            mineralIdByName[name] = id;
        }

        // Wstaw domki
        var houseIdMap = new Dictionary<string, int>();
        foreach (var h in dto.Houses)
        {
            var id = await db.ExecuteScalarAsync<int>(
                "INSERT INTO Houses (X, Y) VALUES (@x, @y) RETURNING Id",
                new { x = (int)h.X, y = (int)h.Y }, tx);
            houseIdMap[h.Id] = id;
        }

        // Wstaw kopalnie
        var depositIdMap = new Dictionary<string, int>();
        foreach (var m in dto.Mines)
        {
            var mineralName = m.Mineral ?? m.MineralType ?? "";
            if (!mineralIdByName.TryGetValue(mineralName, out var mineralId)) continue;
            var id = await db.ExecuteScalarAsync<int>(
                "INSERT INTO Deposits (MineralId, Capacity, X, Y) VALUES (@mineralId, @capacity, @x, @y) RETURNING Id",
                new { mineralId, capacity = m.Capacity, x = (int)m.X, y = (int)m.Y }, tx);
            depositIdMap[m.Id] = id;
        }

        // Wstaw krasnoludki i ich preferencje
        foreach (var h in dto.Houses)
        {
            if (!houseIdMap.TryGetValue(h.Id, out var houseDbId)) continue;
            foreach (var d in h.Dwarfs)
            {
                var dwarfId = await db.ExecuteScalarAsync<int>(
                    "INSERT INTO Dwarfs (Name, HouseId) VALUES (@name, @houseId) RETURNING Id",
                    new { name = d.Name, houseId = houseDbId }, tx);

                foreach (var mineralName in d.MineralPreferences)
                {
                    if (!mineralIdByName.TryGetValue(mineralName, out var mineralId)) continue;
                    await db.ExecuteAsync(
                        "INSERT INTO Preferences (dwarf_id, mineral_id, multiplier) VALUES (@dwarfId, @mineralId, 1.0)",
                        new { dwarfId, mineralId }, tx);
                }
            }
        }

        // Zapisz granicę w Config (małe litery x/y — frontend tego oczekuje)
        var borderJson = JsonSerializer.Serialize(
            dto.Border.Select(p => new { x = p.X, y = p.Y }));
        await db.ExecuteAsync(
            "INSERT INTO Config (Key, Value) VALUES ('border', @border::jsonb) " +
            "ON CONFLICT (Key) DO UPDATE SET Value = EXCLUDED.Value",
            new { border = borderJson }, tx);

        tx.Commit();
        return Results.Ok();
    }
    catch (Exception ex)
    {
        tx.Rollback();
        return Results.Problem(ex.Message);
    }
});

// ── POST /api/assign — uruchamia algorytm na danych z requesta (legacy) ───────
app.MapPost("/api/assign", (AssignRequestDto req) =>
{
    var mineralIds = req.Mines
        .Select(m => m.MineralType).Distinct()
        .Select((name, i) => (name, id: i + 1))
        .ToDictionary(x => x.name, x => x.id);

    var depositToMineId = new Dictionary<int, string>();
    var deposits        = new List<Deposit>();
    for (int i = 0; i < req.Mines.Count; i++)
    {
        var m = req.Mines[i];
        var d = new Deposit(i + 1, mineralIds[m.MineralType], m.Capacity,
                            (int)Math.Round(m.X), (int)Math.Round(m.Y));
        depositToMineId[d.Id] = m.Id;
        deposits.Add(d);
    }

    var dwarfToHouseId = new Dictionary<int, string>();
    var dwarfs         = new List<Dwarf>();
    int dwarfId        = 1;

    for (int hi = 0; hi < req.Houses.Count; hi++)
    {
        var houseDto = req.Houses[hi];
        var house    = new House(hi + 1, (int)Math.Round(houseDto.X), (int)Math.Round(houseDto.Y));

        for (int k = 0; k < houseDto.DwarfCount; k++)
        {
            var prefNames = houseDto.DwarfPreferences != null && k < houseDto.DwarfPreferences.Count
                            ? houseDto.DwarfPreferences[k]
                            : houseDto.MineralPreferences;
            var prefs = prefNames
                .Where(name => mineralIds.ContainsKey(name))
                .ToDictionary(name => mineralIds[name], _ => 1.0f);

            var name  = houseDto.DwarfNames != null && k < houseDto.DwarfNames.Count
                        ? houseDto.DwarfNames[k]
                        : $"Krasnoludek_{houseDto.Id}_{k + 1}";
            var dwarf = new Dwarf(dwarfId, name, 0, false, house.Id);
            dwarf.House       = house;
            dwarf.preferences = prefs;
            dwarfToHouseId[dwarfId] = houseDto.Id;
            dwarfs.Add(dwarf);
            dwarfId++;
        }
    }

    var solver  = new AssignmentSolver();
    solver.SolveAssignments(dwarfs, deposits, req.Algorithm ?? "mcmf");

    var assignments = dwarfs
        .Where(d => d.DepositAssigned && d.Deposit != null)
        .GroupBy(d => new { HouseId = dwarfToHouseId[d.Id], MineId = depositToMineId[d.Deposit!.Id] })
        .Select(g =>
        {
            var sample = g.First();
            var dist   = Math.Sqrt(
                Math.Pow(sample.House!.X - sample.Deposit!.X, 2) +
                Math.Pow(sample.House!.Y  - sample.Deposit!.Y, 2));
            return new AssignmentDto(g.Key.HouseId, g.Key.MineId, g.Count(), dist);
        })
        .ToList();

    double totalDist = assignments.Sum(a => a.Count * a.Distance);
    return Results.Ok(new AssignResultDto(assignments, solver.Logs, totalDist));
});

// ── GET /api/datasets — lista zbiorów ────────────────────────────────────────
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

// ── POST /api/datasets — nowy zbiór ──────────────────────────────────────────
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

// ── DELETE /api/datasets/{name} — usuń zbiór ─────────────────────────────────
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

// ── PUT /api/datasets/{name}/activate — przełącz aktywny zbiór ───────────────
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

app.Run("http://0.0.0.0:8001");

// ── DTOs ──────────────────────────────────────────────────────────────────────
record MineralRow(int Id, string Name);
record SetupDwarfDto(string Id, string Name, List<string> MineralPreferences);
record SetupHouseDto(string Id, double X, double Y, string? Name, List<SetupDwarfDto> Dwarfs);
record SetupMineDto(string Id, double X, double Y, string? Mineral, string? MineralType, int Capacity);
record SetupBorderPointDto(double X, double Y);
record SetupBodyDto(List<SetupBorderPointDto> Border, List<SetupHouseDto> Houses, List<SetupMineDto> Mines);
record HouseDto(string Id, double X, double Y, int DwarfCount,
                List<string> MineralPreferences, List<string>? DwarfNames = null,
                List<List<string>>? DwarfPreferences = null);
record MineDto(string Id, double X, double Y, string MineralType, int Capacity);
record AssignRequestDto(List<HouseDto> Houses, List<MineDto> Mines, string? Algorithm = "mcmf");
record AssignmentDto(string HouseId, string MineId, int Count, double Distance);
record AssignResultDto(List<AssignmentDto> Assignments, List<string> Logs, double TotalDistance);
record CreateDatasetDto(string Label);
