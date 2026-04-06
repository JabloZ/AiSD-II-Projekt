namespace krasnoludki.Algorithms
{
    public class GraphEdge
    {
        public GraphNode From { get; init; }
        public GraphNode To { get; init; }
        public int Capacity { get; init; }
        public double Cost { get; init; } // Nasz dystans
        
        public int Flow { get; set; } // Zmienia się w trakcie algorytmu
        
        // Krawędź powrotna dla sieci rezydualnej
        public GraphEdge? ResidualEdge { get; set; } 

        public GraphEdge(GraphNode from, GraphNode to, int capacity, double cost)
        {
            From = from;
            To = to;
            Capacity = capacity;
            Cost = cost;
            Flow = 0;
        }
    }
}