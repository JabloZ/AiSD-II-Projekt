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
            // === POBIERANIE DANYCH Z BAZY ===
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

            // === 1. PRZYDZIAŁ DO KOPALNI (MIN-COST MAX-FLOW) ===
            Console.WriteLine("\n--- Start silnika Min-Cost Max-Flow ---");
            var solver = new AssignmentSolver();
            solver.SolveAssignments(dwarfs, deposits);

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

            // === 2. TRASA PATROLU (ALGORYTM GRAHAMA) ===
            Console.WriteLine("\n--- Start algorytmu Grahama (Trasa patrolu) ---");
            var patrolSolver = new PatrolSolver();
            var patrolRoute = patrolSolver.FindPatrolRoute(houses, deposits);

            if (patrolRoute.Count >= 3)
            {
                foreach (var point in patrolRoute)
                {
                    Console.WriteLine($" -> {point.Name} [X: {point.X}, Y: {point.Y}]");
                }
            }

            // === 3. OBRONA GRANIC (DRZEWO PRZEDZIAŁOWE) ===
            Console.WriteLine("\n--- Start Obrony Granic (Drzewo Przedziałowe) ---");
            var defenseSolver = new BorderDefenseSolver(dwarfs);
            
            // Przykład - sprawdzamy dowódcę dla całej dostępnej granicy
            if (dwarfs.Count > 0)
            {
                var commander = defenseSolver.GetCommanderForSegment(0, dwarfs.Count - 1);
                Console.WriteLine($"[ATAK] Całą granicą (krasnoludy 0-{dwarfs.Count - 1}) dowodzi: {commander?.Name} (Głośność: {commander?.Loudness})");
            }

            // === 4. KOMPRESJA DANYCH (ALGORYTM HUFFMANA) ===
            Console.WriteLine("\n--- Start Kompresji (Algorytm Huffmana) ---");
            var huffman = new HuffmanSolver();
            string przykladowyRaport = "reneta, antonowka, ligol";
            
            huffman.BuildTree(przykladowyRaport);
            Console.WriteLine($"Przykładowy raport: {przykladowyRaport}");
            Console.WriteLine($"Skompresowany kod:  {huffman.Encode(przykladowyRaport)}");

            Console.WriteLine("\n--- Zakończono działanie aplikacji ---");
            return 0;
        }
    }
}