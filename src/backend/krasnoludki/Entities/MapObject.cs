namespace krasnoludki.Entities
{
    public abstract class MapObject
    {
        public int LocationX { get; set; }
        public int LocationY { get; set; }

        protected MapObject(int locationX, int locationY)
        {
            LocationX = locationX;
            LocationY = locationY;
        }
    }
}