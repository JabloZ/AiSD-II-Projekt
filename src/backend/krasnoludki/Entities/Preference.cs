namespace krasnoludki.Entities
{
    public class Preference
    {
        public int DwarfId { get; set; }
        public int MineralId { get; set; }
        public float Multiplier { get; set; }

        public Preference(int dwarfId, int mineralId, float multiplier)
        {
            DwarfId = dwarfId;
            MineralId = mineralId;
            Multiplier = multiplier;
        }
    }
}
