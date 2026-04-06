namespace krasnoludki.Entities
{
    public class Map
    {
        public int SizeX { get; set; }
        public int SizeY { get; set; }

        public Map(int sizeX, int sizeY)
        {
            SizeX = sizeX;
            SizeY = sizeY;
        }
    }
}