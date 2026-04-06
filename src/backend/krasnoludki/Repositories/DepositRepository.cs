using krasnoludki.Entities;
using krasnoludki.db;
using Npgsql;

namespace krasnoludki.Repositories
{
    public class DepositRepository
    {
        // Przekazujemy z bazy ilość aktualnie przypisanych krasnoludków do tej kopalni
        public bool CanAssign(Deposit deposit, int currentAssignedDwarfsCount)
        {
            return currentAssignedDwarfsCount < deposit.Capacity;
        }
        public async Task<int> GetMineral(Deposit deposit){
                var cur = new DatabaseConn();
                using var conn = await cur.DbConnect();
                using var cmd = new NpgsqlCommand("SELECT mineral_id FROM Deposits WHERE id = @p", conn);
                cmd.Parameters.AddWithValue("p", deposit.Id);
                using var read = await cmd.ExecuteReaderAsync();
                if (await read.ReadAsync())
                {
                    return read.GetInt32(0);
                }
                return -1;
            
        }
    }
}