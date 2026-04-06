using System.Collections.Generic;
using krasnoludki.Entities;

namespace krasnoludki.Algorithms
{
    public class AssignmentSolver
    {
        // Tutaj będzie w przyszłości znajdować się implementacja Forda-Fulkersona
        public void SolveAssignments(List<Dwarf> dwarfs, List<Deposit> deposits, List<Preference> preferences)
        {
            // Szkielet - miejsce na zbudowanie sieci przepływowej G=(V,E,c,s,t)
            var nodes = new List<GraphNode>();
            var edges = new List<GraphEdge>();
            
            var source = new GraphNode("Source", GraphNodeType.Source);
            var sink = new GraphNode("Sink", GraphNodeType.Sink);
            
            nodes.Add(source);
            nodes.Add(sink);

            // TODO: Zbudować wierzchołki dla krasnoludków i kopalni
            // TODO: Wyliczyć odległości (koszty) używając DistanceRepository
            // TODO: Połączyć źródło -> krasnoludki (Capacity = 1, Cost = 0)
            // TODO: Połączyć krasnoludki -> kopalnie (Capacity = 1, Cost = dystans)
            // TODO: Połączyć kopalnie -> ujście (Capacity = Deposit.Capacity, Cost = 0)
            
            // TODO: Uruchomić min-cost max-flow
        }
    }
}