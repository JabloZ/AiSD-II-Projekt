namespace krasnoludki.Entities
{
    public class House
    {
        public int Id { get; init; }
        public int X { get; init; }
        public int Y { get; init; }

        public House(int id, int x, int y)
        {
            Id = id;
            X = x;
            Y = y;
        }
    }
}