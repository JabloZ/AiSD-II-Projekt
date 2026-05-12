using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using krasnoludki.Entities;
using Dapper;
using krasnoludki.db;

namespace krasnoludki.Repositories
{
    public class DepositRepository
    {
        private string _depositsFilePath;

        public DepositRepository()
        {
            SetFilePathFromDb().GetAwaiter().GetResult();
        }

        public async Task SetFilePathFromDb()
        {
            var Cur = new DatabaseConn();
            using var Conn = await Cur.DbConnect();

            var DynamicParameters = new DynamicParameters();
            DynamicParameters.Add("p", Globals.save_id);

            const string Command = "SELECT path FROM Deposits WHERE id = @p";
            string result = await Conn.QueryFirstOrDefaultAsync<string>(Command, DynamicParameters);
            
            _depositsFilePath = result ?? "test_data/deposits.csv";
        }

        public async Task<string> GetPath(int save_id)
        {
            var Cur = new DatabaseConn();
            using var Conn = await Cur.DbConnect();

            var DynamicParameters = new DynamicParameters();
            DynamicParameters.Add("p", save_id);

            const string Command = "SELECT path FROM Deposits WHERE id = @p";
            string Result = await Conn.QueryFirstOrDefaultAsync<string>(Command, DynamicParameters);
            return Result;
        }

        public bool CanAssign(Deposit deposit, int currentCount)
        {
            return currentCount < deposit.Capacity;
        }

        public async Task<int> GetMineral(Deposit deposit)
        {
            string[] lines = await File.ReadAllLinesAsync(_depositsFilePath);

            for (int i = 1; i < lines.Length; i++)
            {
                string[] columns = lines[i].Split(',');
                if (int.Parse(columns[0]) == deposit.Id)
                {
                    return int.Parse(columns[1]); // mineral_id
                }
            }
            return 0;
        }

        public async Task<int> GetCapacity(Deposit deposit)
        {
            string[] lines = await File.ReadAllLinesAsync(_depositsFilePath);
            for (int i = 1; i < lines.Length; i++)
            {
                string[] columns = lines[i].Split(',');
                if (int.Parse(columns[0]) == deposit.Id)
                {
                    return int.Parse(columns[2]); // capacity
                }
            }
            return 0;
        }

        public async Task<(int, int)> GetPosition(Deposit deposit)
        {
            string[] lines = await File.ReadAllLinesAsync(_depositsFilePath);

            for (int i = 1; i < lines.Length; i++)
            {
                string[] columns = lines[i].Split(',');
                if (int.Parse(columns[0]) == deposit.Id)
                {
                    int x = int.Parse(columns[3]);
                    int y = int.Parse(columns[4]);
                    return (x, y);
                }
            }
            return (0, 0);
        }

        public async Task<List<Deposit>> GetDeposits()
        {
            string[] lines = await File.ReadAllLinesAsync(_depositsFilePath);
            List<Deposit> deposits = new List<Deposit>();

            for (int i = 1; i < lines.Length; i++)
            {
                string[] columns = lines[i].Split(',');
                
                Deposit d = new Deposit
                {
                    Id = int.Parse(columns[0]),
                    MineralId = int.Parse(columns[1]),
                    Capacity = int.Parse(columns[2]),
                    X = int.Parse(columns[3]),
                    Y = int.Parse(columns[4])
                };
                
                deposits.Add(d);
            }

            return deposits;
        }
    }
}