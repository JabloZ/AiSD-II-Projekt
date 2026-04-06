namespace krasnoludki.Entities
{
    public class Mineral
    {
        public int Id { get; set; } // Z tabeli Minerals [cite: 668]
        public string Name { get; set; } // Z tabeli Minerals [cite: 668]

        public Mineral(int id, string name)
        {
            Id = id;
            Name = name;
        }
    }
}