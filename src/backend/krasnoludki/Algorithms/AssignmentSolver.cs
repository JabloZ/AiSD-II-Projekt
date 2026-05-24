using krasnoludki.Entities;
using krasnoludki.Repositories;

namespace krasnoludki.Algorithms
{
    public class AssignmentSolver
    {
        // ── Shared state ────────────────────────────────────────────────────
        private List<GraphNode> nodes = new();
        private GraphNode source = null!;
        private GraphNode sink   = null!;

        public List<string> Logs { get; private set; } = new();

        private void Log(string msg) =>
            Logs.Add($"[{DateTime.Now:HH:mm:ss}] {msg}");

        // ── Public entry point ───────────────────────────────────────────────

        /// <summary>
        /// Assigns dwarfs to deposits using the chosen algorithm.
        /// Results are written back into each Dwarf object (DepositId, Deposit, DepositAssigned).
        /// </summary>
        public void SolveAssignments(List<Dwarf> dwarfs, List<Deposit> deposits, string algorithm = "mcmf")
        {
            Logs.Clear();

            switch (algorithm.ToLower())
            {
                case "greedy":
                    SolveGreedy(dwarfs, deposits);
                    break;
                case "random":
                    SolveRandom(dwarfs, deposits);
                    break;
                default: // "mcmf" / "hungarian"
                    SolveMCMF(dwarfs, deposits);
                    break;
            }

            // ── Summary ──────────────────────────────────────────────────────
            int assigned   = dwarfs.Count(d => d.DepositAssigned);
            int unassigned = dwarfs.Count - assigned;
            double totalDist = dwarfs
                .Where(d => d.DepositAssigned && d.House != null && d.Deposit != null)
                .Sum(d => DistanceRepository.CalculateDistance(d.House!, d.Deposit!));

            Log("══════════════════════════════════════════");
            Log($"Przydzielono : {assigned} / {dwarfs.Count} krasnoludków");
            Log($"Łączny dystans: {totalDist:F2} jednostek");
            if (unassigned > 0)
                Log($"Bez przydziału: {unassigned} krasnoludków (brak zgodnych kopalni lub brak pojemności)");
        }

        // ═══════════════════════════════════════════════════════════════════
        //  ALGORYTM 1 — Min-Cost Max-Flow (optymalny)
        //
        //  Modelujemy problem jako sieć przepływową:
        //    Źródło → Krasnoludek (cap=1, cost=0)
        //    Krasnoludek → Kopalnia (cap=1, cost=dystans) — tylko zgodne minerały
        //    Kopalnia → Ujście (cap=pojemność, cost=0)
        //  Successive Shortest Paths z relaksacją Bellmana-Forda.
        //  Złożoność: O(V · E · flow) gdzie flow ≤ liczba krasnoludków
        // ═══════════════════════════════════════════════════════════════════
        private void SolveMCMF(List<Dwarf> dwarfs, List<Deposit> deposits)
        {
            Log("Algorytm: Min-Cost Max-Flow (Successive Shortest Paths)");
            Log($"Krasnoludków: {dwarfs.Count}  |  Kopalni: {deposits.Count}");
            Log("──────────────────────────────────────────");
            Log("Budowanie grafu rezydualnego...");

            BuildGraph(dwarfs, deposits);

            Log($"Graf: {nodes.Count} wierzchołków");
            Log("Obliczanie najtańszego przepływu...");

            CalculateMinCostMaxFlow();

            // Extract results AFTER the full flow computation
            foreach (var node in nodes.Where(n => n.Type == GraphNodeType.Dwarf))
            {
                var dwarf = (Dwarf)node.OriginalEntity!;
                foreach (var edge in node.Edges)
                {
                    if (edge.Flow > 0 && edge.To.Type == GraphNodeType.Deposit)
                    {
                        var deposit = (Deposit)edge.To.OriginalEntity!;
                        dwarf.DepositId       = deposit.Id;
                        dwarf.Deposit         = deposit;
                        dwarf.DepositAssigned = true;
                        double dist = DistanceRepository.CalculateDistance(dwarf.House!, deposit);
                        Log($"Przypisano {dwarf.Name} (id:{dwarf.Id}) → Kopalnia #{deposit.Id} [dystans: {dist:F1}]");
                        break;
                    }
                }

                if (!dwarf.DepositAssigned)
                    Log($"Brak przydziału: {dwarf.Name} (id:{dwarf.Id}) — brak zgodnych kopalni");
            }
        }

        private void BuildGraph(List<Dwarf> dwarfs, List<Deposit> deposits)
        {
            nodes.Clear();
            source = new GraphNode("Source", GraphNodeType.Source);
            sink   = new GraphNode("Sink",   GraphNodeType.Sink);
            nodes.Add(source);
            nodes.Add(sink);

            var dwarfNodes   = new Dictionary<int, GraphNode>();
            var depositNodes = new Dictionary<int, GraphNode>();

            // Źródło → Krasnoludek (cap=1, cost=0)
            foreach (var dwarf in dwarfs)
            {
                var node = new GraphNode($"D_{dwarf.Id}", GraphNodeType.Dwarf, dwarf);
                nodes.Add(node);
                dwarfNodes[dwarf.Id] = node;
                AddEdge(source, node, 1, 0);
            }

            // Kopalnia → Ujście (cap=pojemność, cost=0)
            foreach (var deposit in deposits)
            {
                var node = new GraphNode($"Dep_{deposit.Id}", GraphNodeType.Deposit, deposit);
                nodes.Add(node);
                depositNodes[deposit.Id] = node;
                AddEdge(node, sink, deposit.Capacity, 0);
            }

            // Krasnoludek → Kopalnia (cap=1, cost=dystans) — tylko zgodne minerały
            foreach (var dwarf in dwarfs)
            {
                if (dwarf.House == null) continue;

                var preferredMinerals = dwarf.preferences?.Keys.ToHashSet() ?? new HashSet<int>();

                foreach (var deposit in deposits)
                {
                    if (!preferredMinerals.Contains(deposit.MineralId)) continue;

                    double dist = DistanceRepository.CalculateDistance(dwarf.House, deposit);
                    AddEdge(dwarfNodes[dwarf.Id], depositNodes[deposit.Id], 1, dist);
                }
            }
        }

        private void AddEdge(GraphNode from, GraphNode to, int capacity, double cost)
        {
            var edge     = new GraphEdge(from, to, capacity,  cost);
            var residual = new GraphEdge(to, from, 0,        -cost);
            edge.Residual     = residual;
            residual.Residual = edge;
            from.Edges.Add(edge);
            to.Edges.Add(residual);
        }

        private void CalculateMinCostMaxFlow()
        {
            while (true)
            {
                // Bellman-Ford: find shortest (cheapest) path from source to sink
                var dist       = new Dictionary<GraphNode, double>();
                var parentEdge = new Dictionary<GraphNode, GraphEdge>();

                foreach (var node in nodes) dist[node] = double.MaxValue;
                dist[source] = 0;

                bool relaxed = true;
                for (int i = 0; i < nodes.Count - 1 && relaxed; i++)
                {
                    relaxed = false;
                    foreach (var node in nodes)
                    {
                        if (dist[node] == double.MaxValue) continue;
                        foreach (var edge in node.Edges)
                        {
                            if (edge.RemainingCapacity > 0 && dist[edge.To] > dist[node] + edge.Cost)
                            {
                                dist[edge.To]       = dist[node] + edge.Cost;
                                parentEdge[edge.To] = edge;
                                relaxed = true;
                            }
                        }
                    }
                }

                // No augmenting path to sink → optimal flow reached
                if (dist[sink] == double.MaxValue) break;

                // Find bottleneck along the path
                int flow = int.MaxValue;
                for (var n = sink; n != source; )
                {
                    var e = parentEdge[n];
                    flow = Math.Min(flow, e.RemainingCapacity);
                    n = e.From;
                }

                // Push flow along the path, update residual graph
                for (var n = sink; n != source; )
                {
                    var e = parentEdge[n];
                    e.Flow           += flow;
                    e.Residual!.Flow -= flow;
                    n = e.From;
                }
            }
        }

        // ═══════════════════════════════════════════════════════════════════
        //  ALGORYTM 2 — Zachłanny (heurystyczny)
        //
        //  1. Policz dystans dla każdej dopuszczalnej pary (krasnoludek, kopalnia)
        //  2. Posortuj pary rosnąco po dystansie
        //  3. Przydzielaj od najtańszej pary, o ile oboje wolni i kopalnia ma miejsce
        //  Złożoność: O(n·m·log(n·m)) gdzie n=krasnoludki, m=kopalnie
        // ═══════════════════════════════════════════════════════════════════
        private void SolveGreedy(List<Dwarf> dwarfs, List<Deposit> deposits)
        {
            Log("Algorytm: Zachłanny (sortowanie par po dystansie)");
            Log($"Krasnoludków: {dwarfs.Count}  |  Kopalni: {deposits.Count}");
            Log("──────────────────────────────────────────");

            // Build all valid (dwarf, deposit, dist) triples
            var pairs = new List<(Dwarf dwarf, Deposit deposit, double dist)>();
            foreach (var dwarf in dwarfs)
            {
                if (dwarf.House == null) continue;
                var prefs = dwarf.preferences?.Keys.ToHashSet() ?? new HashSet<int>();
                foreach (var deposit in deposits)
                {
                    if (!prefs.Contains(deposit.MineralId)) continue;
                    double dist = DistanceRepository.CalculateDistance(dwarf.House, deposit);
                    pairs.Add((dwarf, deposit, dist));
                }
            }

            pairs.Sort((a, b) => a.dist.CompareTo(b.dist));

            var assignedDwarfs    = new HashSet<int>();
            var depositRemainder  = deposits.ToDictionary(d => d.Id, d => d.Capacity);

            foreach (var (dwarf, deposit, dist) in pairs)
            {
                if (assignedDwarfs.Contains(dwarf.Id))          continue;
                if (depositRemainder[deposit.Id] <= 0)           continue;

                dwarf.DepositId       = deposit.Id;
                dwarf.Deposit         = deposit;
                dwarf.DepositAssigned = true;
                assignedDwarfs.Add(dwarf.Id);
                depositRemainder[deposit.Id]--;

                Log($"Przypisano {dwarf.Name} (id:{dwarf.Id}) → Kopalnia #{deposit.Id} [dystans: {dist:F1}]");
            }

            foreach (var dwarf in dwarfs.Where(d => !d.DepositAssigned))
                Log($"Brak przydziału: {dwarf.Name} (id:{dwarf.Id}) — brak zgodnych kopalni");
        }

        // ═══════════════════════════════════════════════════════════════════
        //  ALGORYTM 3 — Losowy (baseline)
        //
        //  Dla każdego krasnoludka wybiera losową zgodną kopalnię
        //  z pozostałą pojemnością. Nie optymalizuje dystansu.
        //  Złożoność: O(n·m)
        // ═══════════════════════════════════════════════════════════════════
        private void SolveRandom(List<Dwarf> dwarfs, List<Deposit> deposits)
        {
            Log("Algorytm: Losowy (baseline, bez optymalizacji)");
            Log($"Krasnoludków: {dwarfs.Count}  |  Kopalni: {deposits.Count}");
            Log("──────────────────────────────────────────");

            var rng              = new Random();
            var depositRemainder = deposits.ToDictionary(d => d.Id, d => d.Capacity);
            var shuffled         = dwarfs.OrderBy(_ => rng.Next()).ToList();

            foreach (var dwarf in shuffled)
            {
                if (dwarf.House == null) continue;
                var prefs = dwarf.preferences?.Keys.ToHashSet() ?? new HashSet<int>();

                var candidates = deposits
                    .Where(d => prefs.Contains(d.MineralId) && depositRemainder[d.Id] > 0)
                    .ToList();

                if (candidates.Count == 0)
                {
                    Log($"Brak przydziału: {dwarf.Name} (id:{dwarf.Id}) — brak zgodnych kopalni");
                    continue;
                }

                var deposit = candidates[rng.Next(candidates.Count)];
                dwarf.DepositId       = deposit.Id;
                dwarf.Deposit         = deposit;
                dwarf.DepositAssigned = true;
                depositRemainder[deposit.Id]--;

                double dist = DistanceRepository.CalculateDistance(dwarf.House, deposit);
                Log($"Przypisano {dwarf.Name} (id:{dwarf.Id}) → Kopalnia #{deposit.Id} [dystans: {dist:F1}]");
            }
        }
    }
}
