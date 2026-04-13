//Plik do usuniecia w nastepnych sprintach, ma on pokazac dzialanie api | baza danych <-> program |
using krasnoludki.Repositories;
using krasnoludki.Entities;

namespace krasnoludki.test{
    class Test{
        public static async Task<int> Func(){
            Deposit zloto = new Deposit(1,1,1,1,1);
            DepositRepository repo = new DepositRepository();
            int mineral=await repo.GetMineral(zloto);
            
            return mineral;
        }
    }
}