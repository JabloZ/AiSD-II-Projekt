using System;
using System.Collections.Generic;
using System.Linq;
using krasnoludki.Entities;
using krasnoludki.Repositories;

namespace krasnoludki.Algorithms
{
    public class AssignmentSolver
    {
        private List<GraphNode> nodes = new List<GraphNode>();
        private GraphNode source = null!;
        private GraphNode sink = null!;

        public List<string> Logs { get; private set; } = new List<string>();

        private void Log(string msg) =>
            Logs.Add($"[{DateTime.Now:HH:mm:ss}] {msg}");

        public void SolveAssignments(List<Dwarf> dwarfs, List<Deposit> deposits)
        {
            Logs.Clear();
            Log("Algorytm: Min-Cost Max-Flow (Successive Shortest Paths)");
            Log($"Krasnoludków: {dwarfs.Count}  |  Kopalni: {deposits.Count}");
            Log("──────────────────────────────────────────");
            Log("Budowanie grafu rezydualnego...");

            BuildGraph(dwarfs, deposits);

            Log($"Graf: {nodes.Count} wierzchołków");
            Log("Obliczanie najtańszego przepływu...");

            CalculateMinCostMaxFlow(dwarfs);

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

        private void BuildGraph(List<Dwarf> dwarfs, List<Deposit> deposits)
        {
            nodes.Clear();
            source = new GraphNode("Source", GraphNodeType.Source);
            sink = new GraphNode("Sink", GraphNodeType.Sink);
            nodes.Add(source);
            nodes.Add(sink);

            var dwarfNodes = new Dictionary<int, GraphNode>();
            var depositNodes = new Dictionary<int, GraphNode>();

            // 1. Krawędzie: Źródło -> Krasnoludki (Pojemność 1, Koszt 0)
            foreach (var dwarf in dwarfs)
            {
                var node = new GraphNode($"D_{dwarf.Id}", GraphNodeType.Dwarf, dwarf);
                nodes.Add(node);
                dwarfNodes[dwarf.Id] = node;

                AddEdge(source, node, 1, 0);
            }

            // 2. Krawędzie: Kopalnie -> Ujście (Pojemność = Capacity, Koszt 0)
            foreach (var deposit in deposits)
            {
                var node = new GraphNode($"Dep_{deposit.Id}", GraphNodeType.Deposit, deposit);
                nodes.Add(node);
                depositNodes[deposit.Id] = node;

                AddEdge(node, sink, deposit.Capacity, 0);
            }

            // 3. Krawędzie: Krasnoludki -> Kopalnie (Pojemność 1, Koszt = Dystans)
            foreach (var dwarf in dwarfs)
            {
                if (dwarf.House == null) continue;

                foreach (var deposit in deposits)
                {
                    // Sprawdzamy czy słownik ma wpis o tym minerale i czy mnożnik jest większy od zera
                    if (dwarf.preferences != null &&
                        dwarf.preferences.TryGetValue(deposit.MineralId, out float multiplier) &&
                        multiplier > 0)
                    {
                        double dist = DistanceRepository.CalculateDistance(dwarf.House, deposit);
                        AddEdge(dwarfNodes[dwarf.Id], depositNodes[deposit.Id], 1, dist);
                    }
                }
            }
        }

        private void AddEdge(GraphNode from, GraphNode to, int capacity, double cost)
        {
            // Główna krawędź
            var edge = new GraphEdge(from, to, capacity, cost);
            // Krawędź powrotna (rezydualna) - pojemność 0, koszt ujemny (cofa dystans)
            var residual = new GraphEdge(to, from, 0, -cost);

            edge.Residual = residual;
            residual.Residual = edge;

            from.Edges.Add(edge);
            to.Edges.Add(residual);
        }

        private void CalculateMinCostMaxFlow(List<Dwarf> dwarfs)
        {
            // Algorytm z użyciem Bellmana-Forda do znalezienia najtańszej ścieżki
            while (true)
            {
                var dist = new Dictionary<GraphNode, double>();
                var parentEdge = new Dictionary<GraphNode, GraphEdge>();

                foreach (var node in nodes) dist[node] = double.MaxValue;
                dist[source] = 0;

                // Bellman-Ford
                bool changed = true;
                for (int i = 0; i < nodes.Count - 1 && changed; i++)
                {
                    changed = false;
                    foreach (var node in nodes)
                    {
                        if (dist[node] == double.MaxValue) continue;

                        foreach (var edge in node.Edges)
                        {
                            if (edge.RemainingCapacity > 0 && dist[edge.To] > dist[node] + edge.Cost)
                            {
                                dist[edge.To] = dist[node] + edge.Cost;
                                parentEdge[edge.To] = edge;
                                changed = true;
                            }
                        }
                    }
                }

                // Jeśli nie znaleźliśmy drogi do ujścia, znaczy to, że wykorzystaliśmy cały możliwy przepływ
                if (dist[sink] == double.MaxValue)
                    break;

                // Szukamy "wąskiego gardła" na znalezionej ścieżce
                int pushFlow = int.MaxValue;
                var curr = sink;
                while (curr != source)
                {
                    var edge = parentEdge[curr];
                    pushFlow = Math.Min(pushFlow, edge.RemainingCapacity);
                    curr = edge.From;
                }

                // Przepychamy krasnoludka i aktualizujemy sieć rezydualną
                curr = sink;
                while (curr != source)
                {
                    var edge = parentEdge[curr];
                    edge.Flow += pushFlow;
                    edge.Residual!.Flow -= pushFlow; // Krawędź powrotna zyskuje możliwość "cofnięcia" krasnoludka
                    curr = edge.From;
                }
            }

            // Analiza grafu po zakończeniu przepływu
            foreach (var node in nodes.Where(n => n.Type == GraphNodeType.Dwarf))
            {
                var dwarf = (Dwarf)node.OriginalEntity!;

                // Szukamy krawędzi, którą faktycznie poszedł przepływ (Flow > 0) do kopalni
                foreach (var edge in node.Edges)
                {
                    if (edge.Flow > 0 && edge.To.Type == GraphNodeType.Deposit)
                    {
                        var deposit = (Deposit)edge.To.OriginalEntity!;
                        dwarf.DepositId = deposit.Id;
                        dwarf.Deposit = deposit;
                        dwarf.DepositAssigned = true;
                        double d = DistanceRepository.CalculateDistance(dwarf.House!, deposit);
                        Log($"Przypisano {dwarf.Name} (id:{dwarf.Id}) → Kopalnia #{deposit.Id} [dystans: {d:F1}]");
                        break;
                    }
                }

                if (!dwarf.DepositAssigned)
                    Log($"Brak przydziału: {dwarf.Name} (id:{dwarf.Id}) — brak zgodnych kopalni");
            }
        }
    }
}