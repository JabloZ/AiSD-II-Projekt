using System;
using System.Collections.Generic;
using krasnoludki.Entities;

namespace krasnoludki.Algorithms
{
    public class BorderDefenseSolver
    {
        // Tablica reprezentująca nasze drzewo przedziałowe
        private Dwarf[] tree;
        private List<Dwarf> borderDwarves;
        private int n;

        public BorderDefenseSolver(List<Dwarf> dwarvesOnBorder)
        {
            borderDwarves = dwarvesOnBorder;
            n = dwarvesOnBorder.Count;
            
            if (n > 0)
            {
                // Bezpieczny rozmiar tablicy dla drzewa przedziałowego (4 * N)
                tree = new Dwarf[4 * n];
                Build(1, 0, n - 1);
            }
            else
            {
                tree = Array.Empty<Dwarf>();
            }
        }

        // Budowa drzewa w czasie O(N)
        private void Build(int node, int start, int end)
        {
            if (start == end)
            {
                // Liść drzewa reprezentuje pojedynczego krasnoludka na murze
                tree[node] = borderDwarves[start];
            }
            else
            {
                int mid = (start + end) / 2;
                int leftChild = 2 * node;
                int rightChild = 2 * node + 1;

                Build(leftChild, start, mid);
                Build(rightChild, mid + 1, end);

                // Zapisujemy, kto krzyczy głośniej z obu poddrzew (lewej i prawej strony muru)
                if (tree[leftChild].Loudness >= tree[rightChild].Loudness)
                    tree[node] = tree[leftChild];
                else
                    tree[node] = tree[rightChild];
            }
        }

        // Główne zapytanie o dowódcę z danego przedziału w czasie O(log N)
        public Dwarf? GetCommanderForSegment(int L, int R)
        {
            // Zabezpieczenie przed wyjściem poza tablicę
            if (n == 0 || L < 0 || R >= n || L > R)
                return null;

            return Query(1, 0, n - 1, L, R);
        }

        private Dwarf? Query(int node, int start, int end, int L, int R)
        {
            // Całkowicie poza szukanym przedziałem
            if (R < start || L > end)
                return null;

            // Obecny węzeł jest całkowicie wewnątrz szukanego przedziału
            if (L <= start && end <= R)
                return tree[node];

            // Częściowe pokrycie (schodzimy głębiej)
            int mid = (start + end) / 2;
            int leftChild = 2 * node;
            int rightChild = 2 * node + 1;

            Dwarf? leftResult = Query(leftChild, start, mid, L, R);
            Dwarf? rightResult = Query(rightChild, mid + 1, end, L, R);

            if (leftResult == null) return rightResult;
            if (rightResult == null) return leftResult;

            // Zwracamy tego, który jest głośniejszy
            return leftResult.Loudness >= rightResult.Loudness ? leftResult : rightResult;
        }
    }
}