using System.Collections.Generic;

namespace krasnoludki.Algorithms
{
    // Węzeł drzewa dla automatu Aho-Corasick
    public class AhoCorasickNode
    {
        public Dictionary<char, AhoCorasickNode> Children { get; set; } = new Dictionary<char, AhoCorasickNode>();
        public AhoCorasickNode? Fail { get; set; }
        public List<string> Outputs { get; set; } = new List<string>();
    }

    public class LogAnalyzerSolver
    {
        private AhoCorasickNode root = new AhoCorasickNode();

        // Budowa automatu
        public void BuildAutomaton(IEnumerable<string> patterns)
        {
            root = new AhoCorasickNode();

            // Budowa standardowego drzewa
            foreach (var pattern in patterns)
            {
                var current = root;
                foreach (char c in pattern)
                {
                    if (!current.Children.ContainsKey(c))
                        current.Children[c] = new AhoCorasickNode();
                    current = current.Children[c];
                }
                current.Outputs.Add(pattern); // Zaznaczamy, że w tym węźle kończy się szukane słowo
            }

            // Budowa linków powrotnych (Fail Links) za pomocą algorytmu BFS
            var queue = new Queue<AhoCorasickNode>();

            foreach (var child in root.Children.Values)
            {
                child.Fail = root;
                queue.Enqueue(child);
            }

            while (queue.Count > 0)
            {
                var current = queue.Dequeue();

                foreach (var kvp in current.Children)
                {
                    char c = kvp.Key;
                    var child = kvp.Value;
                    queue.Enqueue(child);

                    var failNode = current.Fail;
                    while (failNode != null && !failNode.Children.ContainsKey(c))
                    {
                        if (failNode == root) break;
                        failNode = failNode.Fail;
                    }

                    if (failNode != null && failNode.Children.ContainsKey(c))
                    {
                        child.Fail = failNode.Children[c];
                        // Dziedziczymy wyniki z węzła powrotnego (dla nakładających się słów)
                        child.Outputs.AddRange(child.Fail.Outputs); 
                    }
                    else
                    {
                        child.Fail = root;
                    }
                }
            }
        }

        // Zwraca Słownik: Klucz = znalezione słowo, Wartość = lista indeksów startowych w logach
        public Dictionary<string, List<int>> Search(string text)
        {
            var results = new Dictionary<string, List<int>>();
            var current = root;

            for (int i = 0; i < text.Length; i++)
            {
                char c = text[i];
                
                // Cofamy się po Fail linkach dopóki nie znajdziemy pasującej ścieżki
                while (current != null && !current.Children.ContainsKey(c))
                {
                    if (current == root) break;
                    current = current.Fail;
                }

                if (current != null && current.Children.ContainsKey(c))
                {
                    current = current.Children[c];
                    
                    // Zapisujemy wszystkie trafienia
                    foreach (var output in current.Outputs)
                    {
                        if (!results.ContainsKey(output))
                            results[output] = new List<int>();
                        
                        // Obliczamy indeks startowy znalezionego słowa
                        results[output].Add(i - output.Length + 1);
                    }
                }
                else
                {
                    current = root;
                }
            }
            return results;
        }
    }
}