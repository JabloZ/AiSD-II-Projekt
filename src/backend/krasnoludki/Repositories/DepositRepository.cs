using krasnoludki.Entities;
using krasnoludki.db;
using Npgsql;
using Dapper;
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
        public async Task<int> GetMineral2(Deposit deposit){
            //Tutaj propozycja czegos pomiedzy pisaniem tych using async await jak u gory a EF core ktore zjadloby caly projekt - czyli Dapper
            var cur= new DatabaseConn();
            using var conn= await cur.DbConnect();

            var p = new DynamicParameters();
            p.Add("p", deposit.Id);

            const string command = "SELECT mineral_id FROM Deposits WHERE id = @p";
            int result=await conn.QueryFirstOrDefaultAsync<int>(command, p); 
            return result;
        }
    }
}