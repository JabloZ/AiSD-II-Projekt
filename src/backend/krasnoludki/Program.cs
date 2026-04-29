using System;
using System.Linq;
using System.Threading.Tasks;
using krasnoludki.db;
using krasnoludki.Repositories;
using krasnoludki.Algorithms;

namespace Start 
{
    class Start 
    {
        public static async Task<int> Main(string[] args) 
        {
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

            return 0;
        }
    }
}
