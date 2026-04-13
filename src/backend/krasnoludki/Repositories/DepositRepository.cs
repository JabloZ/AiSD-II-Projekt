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
        //get capacity

        public async Task<int> GetMineral(Deposit deposit)
        {
            //Tutaj propozycja czegos pomiedzy pisaniem tych using async await jak u gory a EF core ktore zjadloby caly projekt - czyli Dapper
            var cur = new DatabaseConn();
            using var conn = await cur.DbConnect();

            var p = new DynamicParameters();
            p.Add("p", deposit.Id);

            const string command = "SELECT mineral_id FROM Deposits WHERE id = @p";
            int result = await conn.QueryFirstOrDefaultAsync<int>(command, p);
            return result;
        }
        public async Task<int> GetCapacity(Deposit deposit)
        {
            var cur = new DatabaseConn();
            using var conn = await cur.DbConnect();
            var p = new DynamicParameters();
            p.Add("p", deposit.Id);
            const string command = "SELECT capacity FROM Deposits WHERE id = @p";
            int result = await conn.QueryFirstOrDefaultAsync<int>(command, p);
            return result;
        }
        public async Task<(int,int)> GetPosition(Deposit deposit)
        {
            
            var cur = new DatabaseConn();
            using var conn = await cur.DbConnect();

            var p = new DynamicParameters();
            p.Add("p", deposit.Id);
            
            const string command = "SELECT x,y FROM Deposits WHERE id = @p";
            var result = await conn.QuerySingleAsync(command, p);
            int pos_x = (int)result.x;
            int pos_y = (int)result.y;
            return (pos_x, pos_y);
        }
    }
}