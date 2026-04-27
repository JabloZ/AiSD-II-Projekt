namespace krasnoludki.Algorithms
{
    public class GraphEdge
    {
        public GraphNode From { get; init; }
        public GraphNode To { get; init; }
        public int Capacity { get; init; }
        public double Cost { get; init; }
        
        public int Flow { get; set; }
        public GraphEdge? Residual { get; set; } // Referencja do krawędzi powrotnej

        // Ile jeszcze krasnoludków możemy tędy przepuścić?
        public int RemainingCapacity => Capacity - Flow; 

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