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
            SolveMCMF(dwarfs, deposits);

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

    }
}
