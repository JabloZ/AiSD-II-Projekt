using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using krasnoludki.Entities;

namespace krasnoludki.Repositories
{
    public class HouseRepository
    {
        private const string HousesFilePath = "test_data/houses.csv";

        public async Task<List<House>> GetHouses()
        {
            string[] lines = await File.ReadAllLinesAsync(HousesFilePath);
            List<House> houses = new List<House>();
            for (int i = 1; i < lines.Length; i++)
            {
                string[] columns = lines[i].Split(',');
                House h = new House
                {
                    Id = int.Parse(columns[0]),
                    X = int.Parse(columns[1]),
                    Y = int.Parse(columns[2])
                };
                houses.Add(h);
            }
            return houses;
        }
    }
}