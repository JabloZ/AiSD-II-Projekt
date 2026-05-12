using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using krasnoludki.db;
using krasnoludki.Entities;
using Dapper;

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
                var dwarfPrefs = allPreferences.Where(p => p.DwarfId == dwarf.Id);
                dwarf.preferences = dwarfPrefs.ToDictionary(
                    p => p.MineralId, 
                    p => (float)p.Multiplier
                );
            }
            
            return (dwarfs, houses, deposits);
        }
    }
}