// See https://aka.ms/new-console-template for more information
using krasnoludki.db;
namespace Start{
    class Start{
        public static async Task Main(string[] args){
            var cur=new DatabaseConn();
            await cur.DbConnect();
            Console.WriteLine("Hello, World!");
            while(true);
        }
    }
}
