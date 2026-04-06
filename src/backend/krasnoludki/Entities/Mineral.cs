namespace krasnoludki.Entities
{
    public class Mineral
    {
        public int Id { get; init; }
        public string Name { get; init; }

        public Mineral(int id, string name)
        {
            Id = id;
            Name = name;
        }
    }
}