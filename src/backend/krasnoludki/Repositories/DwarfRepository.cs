using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using krasnoludki.Entities;

namespace krasnoludki.Repositories
{
    public class DwarfRepository
    {
        private const string DwarfsFilePath = "test_data/dwarfs.csv";
        private const string DepositsFilePath = "deposits.csv";

        public async Task<List<Dwarf>> GetDwarfs()
        {
            string[] lines = await File.ReadAllLinesAsync(DwarfsFilePath);
            List<Dwarf> dwarfs = new List<Dwarf>();

            for (int i = 1; i < lines.Length; i++)
            {
                string[] columns = lines[i].Split(',');

                int? dId = null;
                if (!string.IsNullOrEmpty(columns[5]))
                {
                    dId = int.Parse(columns[5]);
                }

                Dwarf dwarf = new Dwarf
                {
                    Id = int.Parse(columns[0]),
                    Name = columns[1],
                    Loudness = int.Parse(columns[2]),
                    DepositAssigned = bool.Parse(columns[3]),
                    HouseId = int.Parse(columns[4]),
                    DepositId = dId
                };

                dwarfs.Add(dwarf);
            }

            return dwarfs;
        }

        public async Task<int> GetMineralIdByDepositId(int depositId)
        {
            string[] lines = await File.ReadAllLinesAsync(DepositsFilePath);

            for (int i = 1; i < lines.Length; i++)
            {
                string[] columns = lines[i].Split(',');
                int currentId = int.Parse(columns[0]);

                if (currentId == depositId)
                {
                    return int.Parse(columns[1]);
                }
            }

            return 0;
        }
    }
}