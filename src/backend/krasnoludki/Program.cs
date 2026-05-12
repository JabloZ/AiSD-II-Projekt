using System;
using System.Linq;
using System.Threading.Tasks;
using krasnoludki.db;
using krasnoludki.Repositories;
using krasnoludki.Algorithms;

namespace krasnoludki
{
    public static class Globals
    {
        public static int save_id=1;
    }
    class Start 
    {
        
        public static async Task<int> Main(string[] args) 
        {
            
            // Pobieranie i przygotowanie danych
            Console.WriteLine("--- Start pobierania danych z bazy ---");
            MainRepository m = new MainRepository();
            
            var (dwarfs, houses, deposits) = await m.GetDataSetupFromDB();

            Console.WriteLine($"Pobrano {dwarfs.Count} krasnoludków, {houses.Count} domów i {deposits.Count} kopalni.");

            foreach (var dwarf in dwarfs)
            {
                if (dwarf.House == null)
                {
                    dwarf.House = houses.FirstOrDefault(h => h.Id == dwarf.HouseId);
                }
            }

            // Przydział do kopalni (Min-Cost Max-Flow)
            Console.WriteLine("\n--- Start silnika Min-Cost Max-Flow ---");
            
            var solver = new AssignmentSolver();
            solver.SolveAssignments(dwarfs, deposits);

            Console.WriteLine("\nWyniki przydziału (najkrótsza globalna ścieżka):");
            foreach (var dwarf in dwarfs)
            {
                if (dwarf.DepositAssigned && dwarf.Deposit != null)
                {
                    double dist = Math.Sqrt(Math.Pow(dwarf.House!.X - dwarf.Deposit.X, 2) + 
                                            Math.Pow(dwarf.House!.Y - dwarf.Deposit.Y, 2));

                    Console.WriteLine($"- {dwarf.Name} idzie do Kopalni ID: {dwarf.Deposit.Id} (Dystans: {dist:F2})");
                }
                else
                {
                    Console.WriteLine($"- {dwarf.Name} został bez pracy!");
                }
            }

            // Trasa patrolu (algorytm grahama)
            Console.WriteLine("\n--- Start algorytmu Grahama (Wyznaczanie trasy patrolu) ---");
            
            var patrolSolver = new PatrolSolver();
            var patrolRoute = patrolSolver.FindPatrolRoute(houses, deposits);

            Console.WriteLine("\nPunkty kontrolne na trasie patrolu (Otoczka wypukła):");
            if (patrolRoute.Count < 3)
            {
                Console.WriteLine("Za mało punktów na mapie, aby stworzyć sensowny obwód!");
            }
            else
            {
                foreach (var point in patrolRoute)
                {
                    Console.WriteLine($" -> {point.Name} [X: {point.X}, Y: {point.Y}]");
                }
            }

            return 0;
        }
    }
}
