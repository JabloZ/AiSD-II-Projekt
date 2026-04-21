using Dapper;
using krasnoludki.db;
using krasnoludki.Entities;

namespace krasnoludki.Repositories{
    public class DwarfRepository
    {

        public async Task<List<Dwarf>> GetDwarfs()
        {
            var Cur=new DatabaseConn();
            using var Conn = await Cur.DbConnect();
            const string Command= "SELECT Id, Name, Loudness, DepositAssigned, houseId, depositId from Dwarfs";
            var Dwarfs = await Conn.QueryAsync<Dwarf>(Command);
        
            return Dwarfs.ToList();
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
            var Cur = new DatabaseConn();
            using var Conn = await Cur.DbConnect();

            var P = new DynamicParameters();
            P.Add("p", Deposit.Id);

            const string Command = "SELECT mineral_id FROM Deposits WHERE id = @p";
            int Result = await Conn.QueryFirstOrDefaultAsync<int>(Command, P);
            return Result;
*/