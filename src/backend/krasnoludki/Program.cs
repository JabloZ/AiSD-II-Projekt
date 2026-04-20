using System;
using System.Collections.Generic;
using krasnoludki.Entities;
using krasnoludki.Algorithms;

namespace krasnoludki
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("--- Start algorytmu przydziału krasnoludków ---");

            // 1. Tworzymy Minerały
            var zloto = new Mineral(1, "Złoto");

            // 2. Tworzymy Kopalnie (Deposit)
            // Kopalnia 1: Blisko centrum (10, 10), ale tylko 1 miejsce!
            var kopalnia1 = new Deposit(1, zloto.Id, capacity: 1, x: 10, y: 10) { Mineral = zloto };
            
            // Kopalnia 2: Bardzo daleko (100, 100), dużo miejsc
            var kopalnia2 = new Deposit(2, zloto.Id, capacity: 5, x: 100, y: 100) { Mineral = zloto };

            var deposits = new List<Deposit> { kopalnia1, kopalnia2 };

            // 3. Tworzymy Domki
            var domekA = new House(1, x: 0, y: 0);
            var domekB = new House(2, x: 11, y: 11); // Bardzo blisko Kopalni 1 (10, 10)

            // 4. Tworzymy Krasnoludki
            var krasnoludekA = new Dwarf(1, "Krasnoludek A", loudness: 50, houseId: domekA.Id) { House = domekA };
            var krasnoludekB = new Dwarf(2, "Krasnoludek B", loudness: 50, houseId: domekB.Id) { House = domekB };

            var dwarfs = new List<Dwarf> { krasnoludekA, krasnoludekB };

            // 5. Preferencje (Obaj lubią złoto)
            var prefs = new List<Preference>
            {
                new Preference(krasnoludekA.Id, zloto.Id, 1.5f),
                new Preference(krasnoludekB.Id, zloto.Id, 1.5f)
            };

            // 6. Odpalamy nasz silnik!
            var solver = new AssignmentSolver();
            solver.SolveAssignments(dwarfs, deposits, prefs);

            // 7. Sprawdzamy wyniki
            Console.WriteLine("\nWyniki przydziału:");
            foreach (var dwarf in dwarfs)
            {
                if (dwarf.DepositAssigned)
                {
                    double dist = Math.Sqrt(Math.Pow(dwarf.House!.X - dwarf.AssignedDeposit!.X, 2) + 
                                            Math.Pow(dwarf.House!.Y - dwarf.AssignedDeposit!.Y, 2));
                                            
                    Console.WriteLine($"- {dwarf.Name} przydzielony do Kopalni {dwarf.DepositId} (Dystans: {dist:F2})");
                }
                else
                {
                    Console.WriteLine($"- {dwarf.Name} został bez pracy!");
                }
            }
        }
    }
}