using System.Collections.Generic;

namespace krasnoludki.Algorithms
{
    public class GraphNode
    {
        public string Id { get; init; }
        public GraphNodeType Type { get; init; }
        public object? OriginalEntity { get; init; }
        
        // Lista krawędzi wychodzących z tego wierzchołka
        public List<GraphEdge> Edges { get; set; } = new List<GraphEdge>();

        public GraphNode(string id, GraphNodeType type, object? originalEntity = null)
        {
            Id = id;
            Type = type;
            OriginalEntity = originalEntity;
        }
    }
}