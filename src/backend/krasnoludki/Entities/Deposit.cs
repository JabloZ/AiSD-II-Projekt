namespace krasnoludki.Entities
{
    public class Deposit : MapObject
    {
        public int Mineral { get; set; }
        public int Size { get; set; }
        public int Taken { get; set; }
        public string ImagePath { get; set; }

        public Deposit(int locationX, int locationY, int mineral, int size, int taken, string imagePath) 
            : base(locationX, locationY)
        {
            Mineral = mineral;
            Size = size;
            Taken = taken;
            ImagePath = imagePath;
        }
    }
}