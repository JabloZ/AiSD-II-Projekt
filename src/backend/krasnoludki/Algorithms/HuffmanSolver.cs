using System;
using System.Collections.Generic;
using System.Linq;

namespace krasnoludki.Algorithms
{
    // Węzeł w drzewie Huffmana
    public class HuffmanNode
    {
        public char Symbol { get; set; }
        public int Frequency { get; set; }
        public HuffmanNode? Right { get; set; }
        public HuffmanNode? Left { get; set; }
    }

    public class HuffmanSolver
    {
        private HuffmanNode? root;
        private Dictionary<char, string> huffmanDictionary = new Dictionary<char, string>();

        // 1. Budowa drzewa i słownika na podstawie tekstu
        public void BuildTree(string text)
        {
            // Liczymy częstotliwość występowania każdego znaku
            var frequencies = new Dictionary<char, int>();
            foreach (char c in text)
            {
                if (!frequencies.ContainsKey(c)) frequencies[c] = 0;
                frequencies[c]++;
            }

            // Tworzymy początkową listę węzłów
            var nodes = frequencies.Select(kvp => new HuffmanNode { Symbol = kvp.Key, Frequency = kvp.Value }).ToList();

            // Budujemy drzewo łącząc węzły o najmniejszej częstotliwości
            while (nodes.Count > 1)
            {
                nodes = nodes.OrderBy(n => n.Frequency).ToList();

                var left = nodes[0];
                var right = nodes[1];

                var parent = new HuffmanNode
                {
                    Symbol = '*', // Znak pomocniczy dla węzłów wewnętrznych
                    Frequency = left.Frequency + right.Frequency,
                    Left = left,
                    Right = right
                };

                nodes.Remove(left);
                nodes.Remove(right);
                nodes.Add(parent);
            }

            root = nodes.FirstOrDefault();
            huffmanDictionary.Clear();
            
            // Generujemy ścieżki (0 dla lewo, 1 dla prawo)
            if (root != null)
            {
                GenerateDictionary(root, "");
            }
        }

        private void GenerateDictionary(HuffmanNode node, string currentCode)
        {
            if (node.Left == null && node.Right == null)
            {
                huffmanDictionary[node.Symbol] = currentCode;
                return;
            }

            if (node.Left != null) GenerateDictionary(node.Left, currentCode + "0");
            if (node.Right != null) GenerateDictionary(node.Right, currentCode + "1");
        }

        // 2. Kompresja (Zamiana tekstu na ciąg 0 i 1)
        public string Encode(string text)
        {
            if (root == null) throw new Exception("Drzewo nie zostało zbudowane! Uruchom BuildTree.");
            
            return string.Join("", text.Select(c => huffmanDictionary[c]));
        }

        // 3. Dekompresja (Zamiana zer i jedynek z powrotem na tekst)
        public string Decode(string encodedText)
        {
            if (root == null) throw new Exception("Drzewo nie zostało zbudowane!");

            var decodedResult = "";
            var currentNode = root;

            foreach (char bit in encodedText)
            {
                currentNode = (bit == '0') ? currentNode.Left : currentNode.Right;

                // Jeśli doszliśmy do liścia, dodajemy znak do wyniku i wracamy na szczyt drzewa
                if (currentNode!.Left == null && currentNode.Right == null)
                {
                    decodedResult += currentNode.Symbol;
                    currentNode = root;
                }
            }

            return decodedResult;
        }

        // Metoda pomocnicza do podglądu, jak algorytm oszczędza miejsce
        public void PrintStatistics(string originalText, string encodedText)
        {
            // Zwykły znak to 8 bitów (ASCII)
            int originalBits = originalText.Length * 8;
            int encodedBits = encodedText.Length;
            double savedPercentage = 100.0 - ((double)encodedBits / originalBits * 100);

            Console.WriteLine($"[Statystyki Kompresji Huffmana]");
            Console.WriteLine($"- Rozmiar oryginalny: {originalBits} bitów");
            Console.WriteLine($"- Rozmiar skompresowany: {encodedBits} bitów");
            Console.WriteLine($"- Zaoszczędzone miejsce: {savedPercentage:F2}%");
        }
    }
}