using krasnoludki.db;
using Dapper;
using krasnoludki.Entities;

namespace krasnoludki.Repositories
{
    public class MineralRepository
    {
        public async Task<List<Mineral>> GetMinerals()
        {
            var Cur=new DatabaseConn();
            using var Conn = await Cur.DbConnect();
            const string Command= "SELECT * from Minerals";
            var Minerals = await Conn.QueryAsync<Mineral>(Command);
            return Minerals.ToList();
        }
    }
}