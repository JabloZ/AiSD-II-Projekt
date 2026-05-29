namespace krasnoludki.Api;

using krasnoludki.Algorithms;
using krasnoludki.Entities;
using krasnoludki.Repositories;
using System.Text.Json;
using Npgsql;
using Dapper;

public static class DataEndpoints
{
    public static void MapDataEndpoints(this WebApplication app, string connStr)
    {
        async Task<NpgsqlConnection> Db()
        {
            var conn = new NpgsqlConnection(connStr);
            await conn.OpenAsync();
            await conn.ExecuteAsync($"SET search_path TO \"{Globals.ActualDataset}\"");
            return conn;
        }

        // GET /api/data — wszystkie dane z relacyjnych tabel
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

        // GET /api/assign-from-db — uruchamia algorytm na danych z DB
        app.MapGet("/api/assign-from-db", async () =>
        {
            var repo = new MainRepository();
            var (dwarfs, _, deposits) = await repo.GetDataSetupFromDB();

            var solver = new AssignmentSolver();
            solver.SolveAssignments(dwarfs, deposits);

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

        // PUT /api/setup — zapisuje cały zestaw danych do relacyjnych tabel
        app.MapPut("/api/setup", async (SetupBodyDto dto) =>
        {
            using var db = await Db();
            using var tx = db.BeginTransaction();

            try
            {
                await db.ExecuteAsync(
                    "TRUNCATE Preferences, Dwarfs, Deposits, Houses, Minerals RESTART IDENTITY",
                    transaction: tx);

                var allMineralNames = dto.Mines
                    .Select(m => m.Mineral ?? m.MineralType ?? "")
                    .Concat(dto.Houses.SelectMany(h => h.Dwarfs.SelectMany(d => d.MineralPreferences)))
                    .Where(n => !string.IsNullOrWhiteSpace(n))
                    .Distinct()
                    .ToList();

                var mineralIdByName = new Dictionary<string, int>();
                foreach (var name in allMineralNames)
                {
                    var id = await db.ExecuteScalarAsync<int>(
                        "INSERT INTO Minerals (Name) VALUES (@name) RETURNING Id",
                        new { name }, tx);
                    mineralIdByName[name] = id;
                }

                var houseIdMap = new Dictionary<string, int>();
                foreach (var h in dto.Houses)
                {
                    var id = await db.ExecuteScalarAsync<int>(
                        "INSERT INTO Houses (X, Y) VALUES (@x, @y) RETURNING Id",
                        new { x = (int)h.X, y = (int)h.Y }, tx);
                    houseIdMap[h.Id] = id;
                }

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

        // POST /api/assign — uruchamia algorytm na danych z requesta
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
            solver.SolveAssignments(dwarfs, deposits);

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
    }
}
