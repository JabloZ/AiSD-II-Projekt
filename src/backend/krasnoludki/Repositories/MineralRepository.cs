using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using krasnoludki.Entities;

namespace krasnoludki.Repositories
{
    public class MineralRepository
    {
        private const string MineralsFilePath = "test_data/minerals.csv";
        public async Task<List<Mineral>> GetMinerals()
        {
            string[] lines = await File.ReadAllLinesAsync(MineralsFilePath);
            List<Mineral> minerals = new List<Mineral>();
            for (int i = 1; i < lines.Length; i++)
            {
                string[] columns = lines[i].Split(',');
                Mineral m = new Mineral
                (
                   int.Parse(columns[0]),
                    columns[1]
                );

                minerals.Add(m);
            }

            return minerals;
        }
    }
}