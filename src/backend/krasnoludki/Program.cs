
using krasnoludki.db;
using krasnoludki.test;
namespace Start{
    class Start{
        public static async Task<int> Main(string[] args){
            int test=await Test.Func();
            Console.WriteLine(test); //powinno zwracac 1, czyli id złota 
            while(true);
        }
    }
}
