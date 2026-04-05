namespace krasnoludki.Entities
{
    public class Preference
    {
        public int Mineral { get; set; }
        public float Multiplier { get; set; }

        public Preference(int mineral, float multiplier)
        {
            Mineral = mineral;
            Multiplier = multiplier;
        }
    }
}