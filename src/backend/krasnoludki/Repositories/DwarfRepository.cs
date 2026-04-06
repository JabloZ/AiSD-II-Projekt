using krasnoludki.Entities;

namespace krasnoludki.Repositories
{
    public class DwarfRepository
    {
        public bool IsAvailable(Dwarf dwarf)
        {
            return !dwarf.DepositAssigned;
        }

        // Przekazanie preferencji krasnoludka do weryfikacji z minerałem
        public double CalculateEfficiency(Dwarf dwarf, Preference preference, Deposit deposit)
        {
            if (preference != null && preference.MineralId == deposit.MineralId)
            {
                return dwarf.Volume * preference.Multiplier;
            }
            return dwarf.Volume;
        }

        public void AssignTo(Dwarf dwarf, Deposit deposit)
        {
            dwarf.DepositId = deposit.Id;
            dwarf.AssignedDeposit = deposit;
            dwarf.DepositAssigned = true;
        }
    }
}