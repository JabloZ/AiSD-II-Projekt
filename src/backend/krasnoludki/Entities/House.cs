namespace krasnoludki.Entities
{
    public class House
    {
        public int Id { get; set; }
        public int X { get; set; }
        public int Y { get; set; }

        public House(int id, int x, int y)
        {
            Id = id;
            X = x;
            Y = y;
        }
    }
}