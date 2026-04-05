using krasnoludki.Entities;

namespace krasnoludki.Repositories
{
    public class DepositRepository
    {
        public bool CanAssign(Deposit deposit, Dwarf dwarf)
        {
            return deposit.Taken < deposit.Size;
        }

        public void AssignDwarf(Deposit deposit, Dwarf dwarf)
        {
            if (CanAssign(deposit, dwarf))
            {
                deposit.Taken++;
                // powiązanie krasnoludka w repozytorium krasnoludków
            }
        }

        public void DetachDwarf(Deposit deposit, Dwarf dwarf)
        {
            if (deposit.Taken > 0)
            {
                deposit.Taken--;
            }
        }
    }
}