using krasnoludki.Entities;
using krasnoludki.db;
using Npgsql;
using Dapper;
namespace krasnoludki.Repositories
{
    public class DepositRepository
    {
        // Przekazujemy z bazy ilość aktualnie przypisanych krasnoludków do tej kopalni
        public bool CanAssign(Deposit Deposit, int CurrentAssignedDwarfsCount)
        {
            return CurrentAssignedDwarfsCount < Deposit.Capacity;
        }
        //get capacity

        public async Task<int> GetMineral(Deposit Deposit)
        {
            //Tutaj propozycja czegos pomiedzy pisaniem tych using async await jak u gory a EF core ktore zjadloby caly projekt - czyli Dapper
            var Cur = new DatabaseConn();
            using var Conn = await Cur.DbConnect();

            var P = new DynamicParameters();
            P.Add("p", Deposit.Id);

            const string Command = "SELECT mineral_id FROM Deposits WHERE id = @p";
            int Result = await Conn.QueryFirstOrDefaultAsync<int>(Command, P);
            return Result;
        }
        public async Task<int> GetCapacity(Deposit Deposit)
        {
            var Cur = new DatabaseConn();
            using var Conn = await Cur.DbConnect();
            var DynamicParameters = new DynamicParameters();
            DynamicParameters.Add("p", Deposit.Id);
            const string Command = "SELECT capacity FROM Deposits WHERE id = @p";
            int Result = await Conn.QueryFirstOrDefaultAsync<int>(Command, DynamicParameters);
            return Result;
        }
        public async Task<(int,int)> GetPosition(Deposit Deposit)
        {
            
            var Cur = new DatabaseConn();
            using var Conn = await Cur.DbConnect();

            var DynamicParameters = new DynamicParameters();
            DynamicParameters.Add("p", Deposit.Id);
            
            const string Command = "SELECT x,y FROM Deposits WHERE id = @p";
            var Result = await Conn.QuerySingleAsync(Command, DynamicParameters);
            int PosX = (int)Result.x;
            int PosY = (int)Result.y;
            return (PosX, PosY);
        }
        public async Task<List<Deposit>> GetDeposits()
        {
            var Cur=new DatabaseConn();
            using var Conn = await Cur.DbConnect();
            const string Command= "SELECT * from Deposits";
            var Deposits = await Conn.QueryAsync<Deposit>(Command);
        
            return Deposits.ToList();
        }

    }
}