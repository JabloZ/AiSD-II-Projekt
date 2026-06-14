using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;

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
        if (string.IsNullOrEmpty(text)){
        return;}
        // Zliczanie czestotliwosci
        var frequencies = new Dictionary<char, int>();
        foreach (char c in text)
        {
            frequencies.TryGetValue(c, out int count);
            frequencies[c] = count + 1;
        }

        // Im rzadziej wystepuje tym wyzszy priorytet
        var priorityQueue = new PriorityQueue<HuffmanNode, int>();

        foreach (var (symbol, frequency) in frequencies)
        {
            var leafNode = new HuffmanNode { Symbol = symbol, Frequency = frequency };
            priorityQueue.Enqueue(leafNode, priority: frequency);
        }

        // zabezpieczenie: tekst z jednym unikalnym znakiem
        if (priorityQueue.Count == 1)
        {
            var dummy = new HuffmanNode { Symbol = '\0', Frequency = 0 };
            priorityQueue.Enqueue(dummy, priority: 0);
        }

        // O(n log n) - wstawianie odbywa sie w logn
        while (priorityQueue.Count > 1)
        {
            HuffmanNode left  = priorityQueue.Dequeue();
            HuffmanNode right = priorityQueue.Dequeue();

            var parent = new HuffmanNode
            {
                Symbol    = '*',
                Frequency = left.Frequency + right.Frequency,
                Left      = left,
                Right     = right,
            };

            priorityQueue.Enqueue(parent, priority: parent.Frequency);
        }

        // pobieramy korzen i tworzymy slownik kodow
        root = priorityQueue.Dequeue();
        huffmanDictionary.Clear();

        if (root != null)
            GenerateDictionary(root, currentCode: "");
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

            var decodedResult = new StringBuilder();
            var currentNode = root;

            foreach (char bit in encodedText)
            {
                currentNode = (bit == '0') ? currentNode.Left : currentNode.Right;

                if (currentNode!.Left == null && currentNode.Right == null)
                {
                    decodedResult.Append(currentNode.Symbol);
                    currentNode = root;
                }
            }

            return decodedResult.ToString();
        }

        // 4. Serializacja do binarnego formatu .huff
        //
        // Format pliku:
        //   [4B]  magic "HUFF"
        //   [4B]  liczba unikalnych symboli (int32 LE)
        //   [4B]  długość oryginalnego tekstu (int32 LE)
        //   [4B]  liczba zakodowanych bitów (int32 LE)
        //   Dla każdego symbolu:
        //     [2B] char UTF-16 LE
        //     [4B] długość kodu binarnego
        //     [NB] kod binarny jako ASCII '0'/'1'
        //   Na końcu:
        //     [ceil(bits/8) B] bity spakowane MSB-first
        public byte[] SerializeToHuff(string originalText)
        {
            if (root == null) throw new InvalidOperationException("Drzewo nie zostało zbudowane!");

            string bitString = Encode(originalText);

            using var ms = new MemoryStream();
            using var bw = new BinaryWriter(ms, Encoding.UTF8, leaveOpen: true);

            // Magic
            bw.Write(new byte[] { (byte)'H', (byte)'U', (byte)'F', (byte)'F' });

            // Nagłówek
            bw.Write((int)huffmanDictionary.Count);
            bw.Write((int)originalText.Length);
            bw.Write((int)bitString.Length);

            // Tabela kodów
            foreach (var kvp in huffmanDictionary)
            {
                bw.Write((short)kvp.Key);
                bw.Write((int)kvp.Value.Length);
                bw.Write(Encoding.ASCII.GetBytes(kvp.Value));
            }

            // Spakuj bity do bajtów (MSB first)
            int byteCount = (bitString.Length + 7) / 8;
            byte[] packed = new byte[byteCount];
            for (int i = 0; i < bitString.Length; i++)
            {
                if (bitString[i] == '1')
                    packed[i / 8] |= (byte)(1 << (7 - (i % 8)));
            }

            bw.Write(packed);
            bw.Flush();

            return ms.ToArray();
        }

        // 5. Deserializacja z .huff → oryginalny tekst (metoda statyczna)
        public static string DeserializeFromHuff(byte[] data)
        {
            using var ms = new MemoryStream(data);
            using var br = new BinaryReader(ms, Encoding.UTF8, leaveOpen: true);

            // Sprawdź magic "HUFF"
            var magic = br.ReadBytes(4);
            if (magic[0] != 'H' || magic[1] != 'U' || magic[2] != 'F' || magic[3] != 'F')
                throw new InvalidDataException("Nieprawidłowy format pliku — brakuje nagłówka HUFF.");

            int symbolCount = br.ReadInt32();
            int originalLen = br.ReadInt32();
            int bitCount    = br.ReadInt32();

            // Odczytaj tabelę kodów
            var codeTable = new Dictionary<string, char>();
            for (int i = 0; i < symbolCount; i++)
            {
                char   symbol  = (char)br.ReadInt16();
                int    codeLen = br.ReadInt32();
                string code    = Encoding.ASCII.GetString(br.ReadBytes(codeLen));
                codeTable[code] = symbol;
            }

            // Rozwiń spakowane bajty do stringa bitów
            int    byteCount = (bitCount + 7) / 8;
            byte[] packed    = br.ReadBytes(byteCount);

            var bitSb = new StringBuilder(bitCount);
            for (int i = 0; i < bitCount; i++)
            {
                int b   = packed[i / 8];
                int bit = (b >> (7 - (i % 8))) & 1;
                bitSb.Append(bit == 1 ? '1' : '0');
            }

            // Dekoduj przez tabelę kodów
            var    result  = new StringBuilder(originalLen);
            string current = "";
            foreach (char bit in bitSb.ToString())
            {
                current += bit;
                if (codeTable.TryGetValue(current, out char sym))
                {
                    result.Append(sym);
                    current = "";
                }
            }

            return result.ToString();
        }

        // 6. Statystyki
        public void PrintStatistics(string originalText, string encodedText)
        {
            int originalBits = originalText.Length * 8;
            int encodedBits = encodedText.Length;
            double savedPercentage = 100.0 - ((double)encodedBits / originalBits * 100);

            Console.WriteLine($"[Statystyki Kompresji Huffmana]");
            Console.WriteLine($"- Rozmiar oryginalny: {originalBits} bitów");
            Console.WriteLine($"- Rozmiar skompresowany: {encodedBits} bitów");
            Console.WriteLine($"- Zaoszczędzone miejsce: {savedPercentage:F2}%");
        }

        public Dictionary<char, string> GetDictionary() => new Dictionary<char, string>(huffmanDictionary);
    }
}