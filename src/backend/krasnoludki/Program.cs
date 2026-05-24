using krasnoludki.Algorithms;
using krasnoludki.Entities;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();
app.UseCors();

// POST /api/assign
// Body: { algorithm: "mcmf"|"greedy"|"random", houses: [...], mines: [...] }
app.MapPost("/api/assign", (AssignRequestDto req) =>
{
    // Map mineral names → synthetic int IDs
    var mineralIds = req.Mines
        .Select(m => m.MineralType).Distinct()
        .Select((name, i) => (name, id: i + 1))
        .ToDictionary(x => x.name, x => x.id);

    // Build Deposit objects
    var depositToMineId = new Dictionary<int, string>();
    var deposits = new List<Deposit>();
    for (int i = 0; i < req.Mines.Count; i++)
    {
        var m = req.Mines[i];
        var d = new Deposit(i + 1, mineralIds[m.MineralType], m.Capacity,
                            (int)Math.Round(m.X), (int)Math.Round(m.Y));
        depositToMineId[d.Id] = m.Id;
        deposits.Add(d);
    }

    // Build Dwarf objects — expand each house by DwarfCount
    var dwarfToHouseId = new Dictionary<int, string>();
    var dwarfs = new List<Dwarf>();
    int dwarfId = 1;

    for (int hi = 0; hi < req.Houses.Count; hi++)
    {
        var houseDto = req.Houses[hi];
        var house    = new House(hi + 1, (int)Math.Round(houseDto.X), (int)Math.Round(houseDto.Y));

        for (int k = 0; k < houseDto.DwarfCount; k++)
        {
            // Preferencje per-krasnolud (jeśli podane), fallback do preferencji domku
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

    var solver    = new AssignmentSolver();
    string algo   = req.Algorithm ?? "mcmf";
    solver.SolveAssignments(dwarfs, deposits, algo);

    // Group assignments by (house, mine) to return Count instead of flat list
    var assignments = dwarfs
        .Where(d => d.DepositAssigned && d.Deposit != null)
        .GroupBy(d => new { HouseId = dwarfToHouseId[d.Id], MineId = depositToMineId[d.Deposit!.Id] })
        .Select(g =>
        {
            var sample = g.First();
            var dist   = Math.Sqrt(
                Math.Pow(sample.House!.X - sample.Deposit!.X, 2) +
                Math.Pow(sample.House!.Y  - sample.Deposit!.Y,  2));
            return new AssignmentDto(g.Key.HouseId, g.Key.MineId, g.Count(), dist);
        })
        .ToList();

    double totalDist = assignments.Sum(a => a.Count * a.Distance);

    return Results.Ok(new AssignResultDto(assignments, solver.Logs, totalDist));
});

app.Run("http://0.0.0.0:8001");

// ── DTOs ──────────────────────────────────────────────────────────────────────
record HouseDto(string Id, double X, double Y, int DwarfCount,
                List<string> MineralPreferences, List<string>? DwarfNames = null,
                List<List<string>>? DwarfPreferences = null);
record MineDto(string Id, double X, double Y, string MineralType, int Capacity);
record AssignRequestDto(List<HouseDto> Houses, List<MineDto> Mines, string? Algorithm = "mcmf");
record AssignmentDto(string HouseId, string MineId, int Count, double Distance);
record AssignResultDto(List<AssignmentDto> Assignments, List<string> Logs, double TotalDistance);
