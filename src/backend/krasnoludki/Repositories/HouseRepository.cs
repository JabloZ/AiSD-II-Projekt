using krasnoludki.db;
using Dapper;
using krasnoludki.Entities;

namespace krasnoludki.Repositories
{
    public class HouseRepository
    {
        public async Task<List<House>> GetHouses()
        {
            var Cur=new DatabaseConn();
            using var Conn = await Cur.DbConnect();
            const string Command= "SELECT * from Houses";
            var Houses = await Conn.QueryAsync<House>(Command);
            return Houses.ToList();
        }
    }
}