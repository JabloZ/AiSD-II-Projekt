using krasnoludki.Entities;

namespace krasnoludki.Repositories
{
    public class DepositRepository
    {
        // Przekazujemy z bazy ilość aktualnie przypisanych krasnoludków do tej kopalni
        public bool CanAssign(Deposit deposit, int currentAssignedDwarfsCount)
        {
            return currentAssignedDwarfsCount < deposit.Capacity;
        }
    }
}