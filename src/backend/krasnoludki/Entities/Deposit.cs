namespace krasnoludki.Entities
{
    public class Deposit
    {
        public int Id { get; set; }
        public int MineralId { get; set; }
        public int Capacity { get; set; }
        public int X { get; set; }
        public int Y { get; set; }

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