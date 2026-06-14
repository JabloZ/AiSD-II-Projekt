using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;

namespace krasnoludki.Api;

using Npgsql;
using Dapper;

public static class GenerateEndpoints
{
    private static readonly string[] NAMES =
    [
        "Kamin", "Zarok", "Karoz", "Zyczliwek", "Wromeo", "Julianka", "Bankus",
        "Hohelka", "Chlapibrzuch", "Moczypieta", "Milostek", "Ogorzalek", "Opilek",
        "Twardowski", "Plazus", "Gieldus", "Gilbert", "Pokerek", "Farciarz",
        "Medrek", "Gburek", "Apsik", "Wesolek", "Dwalin", "Balin", "Kili", "Bifur", "Thorin"
    ];

    private static readonly string[] MINERAL_NAMES =
    [
        "Zloto", "Srebro", "Miedz", "Zelazo", "Diament", "Wegiel", "Szmaragd"
    ];

    private const int MAP_X  = 900;
    private const int MAP_Y  = 650;
    private const int MARGIN = 80;

    public static void MapGenerateEndpoints(this WebApplication app, string connStr)
    {
        // POST /api/datasets/{name}/generate — generuje losowe dane dla schematu
        app.MapPost("/api/datasets/{name}/generate", async (string name, GenerateDto dto) =>
        {
            if (dto.Minerals < 1 || dto.Minerals > 7)
                return Results.BadRequest("Liczba minerałów musi być między 1 a 7.");
            if (dto.Dwarfs < 1 || dto.Houses < 1 || dto.Mines < 1)
                return Results.BadRequest("Liczby muszą być dodatnie.");

            var rng = new Random();

            using var conn = new NpgsqlConnection(connStr);
            await conn.OpenAsync();
            await conn.ExecuteAsync($"SET search_path TO \"{name}\"");

            using var tx = conn.BeginTransaction();
            try
            {
                // Wyczyść tabele
                await conn.ExecuteAsync(
                    "TRUNCATE Preferences, Dwarfs, Deposits, Houses, Minerals RESTART IDENTITY CASCADE",
                    transaction: tx);
                await conn.ExecuteAsync(
                    "DELETE FROM Config WHERE Key = 'border'",
                    transaction: tx);

                // 1. Minerały
                var selectedMinerals = MINERAL_NAMES.OrderBy(_ => rng.Next()).Take(dto.Minerals).ToArray();
                var mineralIds = new List<int>();
                foreach (var m in selectedMinerals)
                {
                    var id = await conn.ExecuteScalarAsync<int>(
                        "INSERT INTO Minerals (Name) VALUES (@name) RETURNING Id",
                        new { name = m }, tx);
                    mineralIds.Add(id);
                }

                // 2. Domki
                var houseIds = new List<int>();
                for (int i = 0; i < dto.Houses; i++)
                {
                    var id = await conn.ExecuteScalarAsync<int>(
                        "INSERT INTO Houses (X, Y) VALUES (@x, @y) RETURNING Id",
                        new { x = rng.Next(MARGIN, MAP_X - MARGIN), y = rng.Next(MARGIN, MAP_Y - MARGIN) }, tx);
                    houseIds.Add(id);
                }

                // 3. Kopalnie
                for (int i = 0; i < dto.Mines; i++)
                {
                    var mineralId = mineralIds[rng.Next(mineralIds.Count)];
                    var capacity  = rng.Next(1, 26);
                    await conn.ExecuteAsync(
                        "INSERT INTO Deposits (MineralId, Capacity, X, Y) VALUES (@mineralId, @capacity, @x, @y)",
                        new { mineralId, capacity, x = rng.Next(MARGIN, MAP_X - MARGIN), y = rng.Next(MARGIN, MAP_Y - MARGIN) }, tx);
                }

                // 4. Krasnoludki — round-robin po domkach
                var dwarfIds = new List<int>();
                for (int i = 0; i < dto.Dwarfs; i++)
                {
                    var houseId = houseIds[i % houseIds.Count];
                    var dwarfId = await conn.ExecuteScalarAsync<int>(
                        "INSERT INTO Dwarfs (Name, Loudness, HouseId) VALUES (@name, @loudness, @houseId) RETURNING Id",
                        new { name = NAMES[rng.Next(NAMES.Length)], loudness = rng.Next(1, 101), houseId }, tx);
                    dwarfIds.Add(dwarfId);
                }

                // 5. Preferencje
                foreach (var dwarfId in dwarfIds)
                {
                    int prefCount = rng.Next(1, mineralIds.Count + 1);
                    var selected  = mineralIds.OrderBy(_ => rng.Next()).Take(prefCount);
                    foreach (var mineralId in selected)
                    {
                        var multiplier = Math.Round(rng.NextDouble() * 1.9 + 0.1, 2);
                        await conn.ExecuteAsync(
                            "INSERT INTO Preferences (dwarf_id, mineral_id, multiplier) VALUES (@dwarfId, @mineralId, @multiplier)",
                            new { dwarfId, mineralId, multiplier }, tx);
                    }
                }

                // 6. Granica — prostokąt z marginesem
                var border = JsonSerializer.Serialize(new[]
                {
                    new { x = MARGIN,          y = MARGIN },
                    new { x = MAP_X - MARGIN,  y = MARGIN },
                    new { x = MAP_X - MARGIN,  y = MAP_Y - MARGIN },
                    new { x = MARGIN,          y = MAP_Y - MARGIN },
                });
                await conn.ExecuteAsync(
                    "INSERT INTO Config (Key, Value) VALUES ('border', @border::jsonb) " +
                    "ON CONFLICT (Key) DO UPDATE SET Value = EXCLUDED.Value",
                    new { border }, tx);

                tx.Commit();
                return Results.Ok(new
                {
                    message  = $"Wygenerowano dane dla '{name}'.",
                    dwarfs   = dto.Dwarfs,
                    houses   = dto.Houses,
                    mines    = dto.Mines,
                    minerals = dto.Minerals,
                });
            }
            catch (Exception ex)
            {
                tx.Rollback();
                return Results.Problem(ex.Message);
            }
        });
    }
}
