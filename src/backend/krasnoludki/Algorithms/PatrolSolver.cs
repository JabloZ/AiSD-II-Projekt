using System;
using System.Collections.Generic;
using System.Linq;
using krasnoludki.Entities;

namespace krasnoludki.Algorithms
{
    // Klasa pomocnicza, żeby ujednolicić obiekty na mapie (Domki i Kopalnie)
    public class PatrolPoint
    {
        public int X { get; set; }
        public int Y { get; set; }
        public string Name { get; set; } 
        
        public PatrolPoint(int x, int y, string name)
        {
            X = x;
            Y = y;
            Name = name;
        }
    }

    public class PatrolSolver
    {
        public List<PatrolPoint> FindPatrolRoute(List<House> houses, List<Deposit> deposits)
        {
            // 1. Zbieramy wszystkie punkty w jedno miejsce
            var points = new List<PatrolPoint>();
            foreach (var h in houses) points.Add(new PatrolPoint(h.X, h.Y, $"Domek {h.Id}"));
            foreach (var d in deposits) points.Add(new PatrolPoint(d.X, d.Y, $"Kopalnia {d.Id}"));

            int n = points.Count;
            if (n < 3) return points; // Mniej niż 3 punkty na mapie - otoczką są po prostu te punkty

            // 2. Znajdź pivot najniżej na mapie, najbardziej wysunięty w lewo
            int lowestIndex = 0;
            for (int i = 1; i < n; i++)
            {
                if (points[i].Y < points[lowestIndex].Y || 
                   (points[i].Y == points[lowestIndex].Y && points[i].X < points[lowestIndex].X))
                {
                    lowestIndex = i;
                }
            }

            // Przesuwamy nasz punkt startowy na początek listy
            var temp = points[0];
            points[0] = points[lowestIndex];
            points[lowestIndex] = temp;
            var pivot = points[0];

            // 3. Sortujemy pozostałe punkty według kąta biegunowego względem pivota
            var sortedPoints = points.Skip(1).ToList();
            sortedPoints.Sort((p1, p2) =>
            {
                int orientation = CrossProduct(pivot, p1, p2);
                if (orientation == 0) 
                {
                    // Jeśli punkty leżą na jednej prostej, bliższy punkt ląduje wcześniej
                    return DistanceSquared(pivot, p1).CompareTo(DistanceSquared(pivot, p2));
                }
                // Jeśli skręca w lewo (orientation > 0), p1 jest wcześniej
                return orientation > 0 ? -1 : 1;
            });

            // Usuwamy punkty współliniowe, zostawiając do sprawdzania tylko ten najdalszy
            var filteredPoints = new List<PatrolPoint> { pivot };
            for (int i = 0; i < sortedPoints.Count; i++)
            {
                while (i < sortedPoints.Count - 1 && CrossProduct(pivot, sortedPoints[i], sortedPoints[i + 1]) == 0)
                {
                    i++;
                }
                filteredPoints.Add(sortedPoints[i]);
            }

            if (filteredPoints.Count < 3) return filteredPoints;

            // 4. Algorytm Grahama używający stosu
            var stack = new Stack<PatrolPoint>();
            stack.Push(filteredPoints[0]);
            stack.Push(filteredPoints[1]);
            stack.Push(filteredPoints[2]);

            for (int i = 3; i < filteredPoints.Count; i++)
            {
                // Dopóki nie skręcamy w lewo, wyrzucamy punkty ze stosu
                while (stack.Count > 1 && CrossProduct(NextToTop(stack), stack.Peek(), filteredPoints[i]) <= 0)
                {
                    stack.Pop();
                }
                stack.Push(filteredPoints[i]);
            }

            return stack.ToList();
        }

        // Pomocnicza metoda do zajrzenia na drugi element od góry stosu
        private PatrolPoint NextToTop(Stack<PatrolPoint> stack)
        {
            var top = stack.Pop();
            var next = stack.Peek();
            stack.Push(top);
            return next;
        }

        // Iloczyn wektorowy
        // Wynik > 0: skręt w lewo | Wynik < 0: skręt w prawo | Wynik = 0: punkty współliniowe
        private int CrossProduct(PatrolPoint p1, PatrolPoint p2, PatrolPoint p3)
        {
            return (p2.X - p1.X) * (p3.Y - p1.Y) - (p2.Y - p1.Y) * (p3.X - p1.X);
        }

        // Odległość do kwadratu
        private int DistanceSquared(PatrolPoint p1, PatrolPoint p2)
        {
            return (p1.X - p2.X) * (p1.X - p2.X) + (p1.Y - p2.Y) * (p1.Y - p2.Y);
        }
    }
}