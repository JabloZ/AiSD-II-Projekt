using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using krasnoludki.db;
using krasnoludki.Entities;
using Dapper;

namespace krasnoludki.Repositories
{
    // Mała klasa pomocnicza, żeby Dapper miał do czego przypisać wiersze z bazy
    public class PreferenceDTO
    {
        public int DwarfId { get; set; }
        public int MineralId { get; set; }
        public double Multiplier { get; set; } 
    }

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
    }
}