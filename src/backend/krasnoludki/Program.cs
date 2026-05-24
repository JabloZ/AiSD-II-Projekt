using System;
using System.Linq;
using System.Threading.Tasks;
using krasnoludki.db;
using krasnoludki.Repositories;
using krasnoludki.Algorithms;
using Npgsql;
namespace krasnoludki
{
    public static class Globals
    {
        public static void ChangeGlobalDataset(string new_dataset)
        {
            Globals.actual_dataset=new_dataset;
        }
        public static string actual_dataset="zbior1";
        public static int save_id=1;
    }
    class Start 
    {
        
        public static async Task<int> Main(string[] args) 
        {
            
            var Cur=new DatabaseConn();
            using var Conn = await Cur.DbConnect();
            const string Command= "SET search_path TO zbior1;";
            using (var schemaCmd = new NpgsqlCommand(Command, Conn))
            {
                await schemaCmd.ExecuteNonQueryAsync();
            }
            while(true); // bez tego wylaczy sie kontener backend
            return 0;
        }
    }
}