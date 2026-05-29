using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using krasnoludki.db;
using krasnoludki.Entities;
using Dapper;
using System.Text.Json;
namespace krasnoludki.Repositories
{
    public class MainRepository
    {
        DepositRepository DepositRepo = new DepositRepository();
        DwarfRepository DwarfRepo = new DwarfRepository();
        HouseRepository HouseRepo = new HouseRepository();
        PreferenceRepository PrefRepo = new PreferenceRepository();

        public async Task<(List<Dwarf>, List<House>, List<Deposit>)> GetDataSetupFromDB()
        {
            List<Dwarf> dwarfs = await DwarfRepo.GetDwarfs();
            List<Deposit> deposits = await DepositRepo.GetDeposits();
            List<House> houses = await HouseRepo.GetHouses();

            // 1. Zabezpieczenie domków
            var houseDict = houses.ToDictionary(h => h.Id);
            foreach (var dwarf in dwarfs)
            {
                if (houseDict.TryGetValue(dwarf.HouseId, out var house))
                {
                    dwarf.House = house;
                }
            }
            // 2. Pobieranie preferencji używając nowo podpiętego repozytorium
            var allPreferences = await PrefRepo.GetPreferences();

            foreach (var dwarf in dwarfs)
            {
                // Wyłuskujemy z całej listy tylko te preferencje, które należą do aktualnego krasnoludka
                var dwarfPrefs = allPreferences.Where(p => p.DwarfId == dwarf.Id);
                
                // Tworzymy mu słownik (rzutujemy double na float, bo tak mamy ustawione w encji Dwarf)
                dwarf.preferences = dwarfPrefs.ToDictionary(
                    p => p.MineralId, 
                    p => (float)p.Multiplier
                );
            }
            
            return (dwarfs, houses, deposits);
        }
        public async Task<string> GetDataSetupAsJson()
        {

            var (dwarfs, houses, deposits) = await GetDataSetupFromDB();
            var dataEnvelope = new
            {
                Dwarfs = dwarfs,
                Houses = houses,
                Deposits = deposits
            };

            var options = new JsonSerializerOptions
            {
                WriteIndented = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };
            return JsonSerializer.Serialize(dataEnvelope, options);
        }
    }
}