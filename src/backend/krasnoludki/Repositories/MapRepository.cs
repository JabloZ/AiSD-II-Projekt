using krasnoludki.Entities;

namespace krasnoludki.Repositories
{
    public class MapRepository
    {
        public string GenerateImage(Map map)
        {
            // Logika renderowania mapy
            return "sciezka_do_wygenerowanej_mapy.png";
        }

        // Oddzielne metody dla konkretnych encji z bazy
        public void AddHouseToMap(Map map, House house)
        {
            map.Houses.Add(house);
        }

        public void AddDepositToMap(Map map, Deposit deposit)
        {
            map.Deposits.Add(deposit);
        }
    }
}