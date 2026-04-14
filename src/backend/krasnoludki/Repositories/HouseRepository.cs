using krasnoludki.db;
using Dapper;
using krasnoludki.Entities;

namespace krasnoludki.Repositories
{
    public class HouseRepository
    {
        public async Task<List<House>> GetHouses()
        {
            var cur=new DatabaseConn();
            using var conn = await cur.DbConnect();
            const string command= "SELECT * from Houses";
            var houses = await conn.QueryAsync<House>(command);
            return houses.ToList();
        }
    }
}