using krasnoludki.Entities;

namespace krasnoludki.Repositories
{
    public class DwarfRepository
    {
        public bool IsAvailable(Dwarf dwarf)
        {
            return !dwarf.DepositAssigned;
        }

        public double CalculateEfficiency(Dwarf dwarf, Deposit deposit)
        {
            // Logika wyliczania wydajności na podstawie preferencji i dystansu
            if (dwarf.Preference.Mineral == deposit.Mineral)
            {
                return dwarf.Volume * dwarf.Preference.Multiplier;
            }
            return dwarf.Volume;
        }

        public void AssignTo(Dwarf dwarf, MapObject target)
        {
            if (target is Deposit deposit)
            {
                dwarf.AssignedDeposit = deposit;
                dwarf.DepositAssigned = true;
            }
        }
    }
}