using Dapper;
using krasnoludki.db;
using krasnoludki.Entities;

namespace krasnoludki.Repositories{
    public class DwarfRepository
    {

        public async Task<List<Dwarf>> GetDwarfs()
        {
            var cur=new DatabaseConn();
            using var conn = await cur.DbConnect();
            const string command= "SELECT Id, Name, Loudness, DepositAssigned, houseId, depositId from Dwarfs";
            var dwarfs = await conn.QueryAsync<Dwarf>(command);
        
            return dwarfs.ToList();
        }
    }
}
/*
CREATE TABLE Dwarfs(
    id INT PRIMARY KEY,
    name VARCHAR(50),
    volume INT,
    deposit_assigned BOOLEAN,
    house_id INT REFERENCES House(id),
    deposit_id INT NULL REFERENCES Deposits(id) 
);
            var cur = new DatabaseConn();
            using var conn = await cur.DbConnect();

            var p = new DynamicParameters();
            p.Add("p", deposit.Id);

            const string command = "SELECT mineral_id FROM Deposits WHERE id = @p";
            int result = await conn.QueryFirstOrDefaultAsync<int>(command, p);
            return result;
*/