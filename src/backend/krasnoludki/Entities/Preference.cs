namespace krasnoludki.Entities
{
    public class Preference
    {
        public int DwarfId { get; set; } // Z tabeli Preferences [cite: 671]
        public int MineralId { get; set; } // Z tabeli Preferences [cite: 671]
        public float Multiplier { get; set; } // Z tabeli Preferences [cite: 671]

        public Preference(int dwarfId, int mineralId, float multiplier)
        {
            DwarfId = dwarfId;
            MineralId = mineralId;
            Multiplier = multiplier;
        }
    }
}