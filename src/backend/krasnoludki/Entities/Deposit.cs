namespace krasnoludki.Entities
{
    public class Deposit
    {
        public int Id { get; init; }
        public int MineralId { get; init; }
        public int Capacity { get; init; }
        public int X { get; init; }
        public int Y { get; init; }

        // Właściwość nawigacyjna
        public Mineral? Mineral { get; set; } 
        public Deposit(){}
        public Deposit(int id, int mineralId, int capacity, int x, int y)
        {
            Id = id;
            MineralId = mineralId;
            Capacity = capacity;
            X = x;
            Y = y;
        }
    }
}