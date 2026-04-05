namespace krasnoludki.Entities
{
    public class House : MapObject
    {
        public string ImagePath { get; set; }

        public House(int locationX, int locationY, string imagePath) 
            : base(locationX, locationY)
        {
            ImagePath = imagePath;
        }
    }
}