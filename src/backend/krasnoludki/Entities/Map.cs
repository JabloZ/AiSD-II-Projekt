using System.Collections.Generic;

namespace krasnoludki.Entities
{
    public class Map
    {
        public int SizeX { get; set; }
        public int SizeY { get; set; }
        
        // Reprezentacja wektora obiektów z diagramu UML
        public List<MapObject> MapObjects { get; set; }

        public Map(int sizeX, int sizeY)
        {
            SizeX = sizeX;
            SizeY = sizeY;
            MapObjects = new List<MapObject>();
        }
    }
}