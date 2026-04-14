using krasnoludki.db;
using Dapper;
using krasnoludki.Entities;

namespace krasnoludki.Repositories
{
    public class MineralRepository
    {
        public async Task<List<Mineral>> GetMinerals()
        {
            var cur=new DatabaseConn();
            using var conn = await cur.DbConnect();
            const string command= "SELECT * from Minerals";
            var minerals = await conn.QueryAsync<Mineral>(command);
            return minerals.ToList();
        }
    }
}