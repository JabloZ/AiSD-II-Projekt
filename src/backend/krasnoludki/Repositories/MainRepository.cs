using krasnoludki.db;
using krasnoludki.Entities;
namespace krasnoludki.Repositories
{
    public class MainRepository()
    {
        DepositRepository DepositRepo=new DepositRepository();
        DwarfRepository DwarfRepo=new DwarfRepository();
        HouseRepository HouseRepo=new HouseRepository();
        public async Task<(List<Dwarf>,List<House>,List<Deposit>)> GetDataSetupFromDB()
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
            
            return (dwarfs,houses,deposits);


        }
    }
}