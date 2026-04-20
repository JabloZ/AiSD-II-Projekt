namespace krasnoludki.Entities
{
    public class Preference
    {
        public int DwarfId { get; init; }
        public int MineralId { get; init; }
        public float Multiplier { get; init; }

        public Preference(int dwarfId, int mineralId, float multiplier)
        {
            DwarfId = dwarfId;
            MineralId = mineralId;
            Multiplier = multiplier;
        }
    }
}