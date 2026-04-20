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

        public void SolveAssignments(List<Dwarf> dwarfs, List<Deposit> deposits, List<Preference> preferences)
        {
            BuildGraph(dwarfs, deposits, preferences);
            CalculateMinCostMaxFlow();
        }

        private void BuildGraph(List<Dwarf> dwarfs, List<Deposit> deposits, List<Preference> preferences)
        {
            nodes.Clear();
            source = new GraphNode("Source", GraphNodeType.Source);
            sink = new GraphNode("Sink", GraphNodeType.Sink);
            nodes.Add(source);
            nodes.Add(sink);

            var dwarfNodes = new Dictionary<int, GraphNode>();
            var depositNodes = new Dictionary<int, GraphNode>();

            // 1. KRAWĘDZIE: Źródło -> Krasnoludki (Pojemność 1, Koszt 0)
            foreach (var dwarf in dwarfs)
            {
                var node = new GraphNode($"D_{dwarf.Id}", GraphNodeType.Dwarf, dwarf);
                nodes.Add(node);
                dwarfNodes[dwarf.Id] = node;
                
                AddEdge(source, node, 1, 0);
            }

            // 2. KRAWĘDZIE: Kopalnie -> Ujście (Pojemność = Capacity, Koszt 0)
            foreach (var deposit in deposits)
            {
                var node = new GraphNode($"Dep_{deposit.Id}", GraphNodeType.Deposit, deposit);
                nodes.Add(node);
                depositNodes[deposit.Id] = node;
                
                AddEdge(node, sink, deposit.Capacity, 0);
            }

            // 3. KRAWĘDZIE: Krasnoludki -> Kopalnie (Pojemność 1, Koszt = Dystans)
            foreach (var dwarf in dwarfs)
            {
                // Znajdź ID minerałów, które lubi ten krasnoludek
                var preferredMinerals = preferences.Where(p => p.DwarfId == dwarf.Id).Select(p => p.MineralId).ToList();

                foreach (var deposit in deposits)
                {
                    // TWORZYMY KRAWĘDŹ TYLKO JEŚLI MINERAL SIĘ ZGADZA (Zachowanie wartości dóbr!)
                    if (preferredMinerals.Contains(deposit.MineralId))
                    {
                        // Upewnij się, że obiekt House nie jest nullem (powinien być zaciągnięty z bazy)
                        if (dwarf.House != null)
                        {
                            double dist = DistanceRepository.CalculateDistance(dwarf.House, deposit);
                            AddEdge(dwarfNodes[dwarf.Id], depositNodes[deposit.Id], 1, dist);
                        }
                    }
                }
            }
        }

        private void AddEdge(GraphNode from, GraphNode to, int capacity, double cost)
        {
            // Główna krawędź
            var edge = new GraphEdge(from, to, capacity, cost);
            // Krawędź powrotna (rezydualna) - pojemność 0, koszt ujemny (cofa dystans!)
            var residual = new GraphEdge(to, from, 0, -cost); 

            edge.Residual = residual;
            residual.Residual = edge;

            from.Edges.Add(edge);
            to.Edges.Add(residual);
        }

        private void CalculateMinCostMaxFlow()
        {
            // Algorytm Successive Shortest Path (używa Bellmana-Forda do znalezienia najtańszej ścieżki)
            while (true)
            {
                var dist = new Dictionary<GraphNode, double>();
                var parentEdge = new Dictionary<GraphNode, GraphEdge>();

                foreach(var node in nodes) dist[node] = double.MaxValue;
                dist[source] = 0;

                // Relaksacja krawędzi (Bellman-Ford)
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

                // Jeśli nie znaleźliśmy drogi do Ujścia, znaczy to, że wykorzystaliśmy cały możliwy przepływ
                if (dist[sink] == double.MaxValue)
                    break;

                // Szukamy "wąskiego gardła" na znalezionej ścieżce (tutaj zawsze będzie 1, ale to dobra praktyka)
                int pushFlow = int.MaxValue;
                var curr = sink;
                while (curr != source)
                {
                    var edge = parentEdge[curr];
                    pushFlow = Math.Min(pushFlow, edge.RemainingCapacity);
                    curr = edge.From;
                }

                // Przepychamy krasnoludka i aktualizujemy sieć rezydualną!
                curr = sink;
                while (curr != source)
                {
                    var edge = parentEdge[curr];
                    edge.Flow += pushFlow;
                    edge.Residual!.Flow -= pushFlow; // Krawędź powrotna zyskuje możliwość "cofnięcia" krasnoludka
                    curr = edge.From;
                }

                // Wyciągamy wnioski z grafu
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
                            dwarf.AssignedDeposit = deposit;
                            break;
                        }
                    }
                }
            }
        }

        
    }
}