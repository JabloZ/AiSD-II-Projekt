namespace krasnoludki.Entities
{
    public class Preference
    {
        public int DwarfId { get; set; }
        public int MineralId { get; set; }
        public double Multiplier { get; set; }

        public Preference(int dwarfId, int mineralId, double multiplier)
        {
            DwarfId = dwarfId;
            MineralId = mineralId;
            Multiplier = multiplier;
        }

        public Preference() { }
    }
}