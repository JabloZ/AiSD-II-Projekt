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

            // Obrona granic (drzewo przedziałowe)
            Console.WriteLine("\n--- Start Obrony Granic (Drzewo Przedziałowe) ---");
            
            // Do testów ustawiamy na murze wszystkie nasze krasnoludki z bazy w jeden szereg
            var defenseSolver = new BorderDefenseSolver(dwarfs);

            // Zakładamy testowe próby szmuglu na konkretne indeksy
            var smugglingAttempts = new[]
            {
                new { Start = 0, End = 1, Opis = "lewe skrzydło muru" },
                new { Start = 1, End = 2, Opis = "prawe skrzydło muru" },
                new { Start = 0, End = 2, Opis = "całą szerokość muru" }
            };

            foreach (var attempt in smugglingAttempts)
            {
                var commander = defenseSolver.GetCommanderForSegment(attempt.Start, attempt.End);
                if (commander != null)
                {
                    Console.WriteLine($"\n[SZMUGIEL JABŁEK] Krnąbrne krasnoludki przerzucają renety i papierówki przez {attempt.Opis} (krasnoludy {attempt.Start}-{attempt.End})!");
                    Console.WriteLine($"Dowództwo przejmuje najgłośniejszy dekametrowiec: {commander.Name} (Głośność: {commander.Loudness})");
                    Console.WriteLine($"{commander.Name} ryczy: \"Strzały na cięciwy – naciągnąć cięciwy – strzał!\"");
                }
            }

            // Kopresja danych (algorytm Huffmana)
            Console.WriteLine("\n--- Start Kompresji Raportów (Algorytm Huffmana) ---");

            // Dowódca tworzy długi, powtarzalny raport o przechwyconych jabłkach
            string raportZeSzmuglu = "reneta, antonowka, reneta, ligol, papierowka, reneta, reneta, ligol, antonowka, reneta";
            Console.WriteLine($"Oryginalny raport: {raportZeSzmuglu}");

            var huffman = new HuffmanSolver();
            
            // 1. Budujemy drzewo dla tego konkretnego raportu
            huffman.BuildTree(raportZeSzmuglu);

            // 2. Kodujemy wiadomość (kompresja)
            string skompresowanyRaport = huffman.Encode(raportZeSzmuglu);
            Console.WriteLine($"Skompresowana wiadomość (kod binarny): \n{skompresowanyRaport}");

            // 3. Dekodujemy wiadomość (dekompresja)
            string odkodowanyRaport = huffman.Decode(skompresowanyRaport);
            
            Console.WriteLine($"\nCzy odkodowany raport zgadza się z oryginałem? : {raportZeSzmuglu == odkodowanyRaport}");
            
            // Wyświetlamy statystyki zysku pamięciowego
            huffman.PrintStatistics(raportZeSzmuglu, skompresowanyRaport);

            return 0;
        }
    }
}
