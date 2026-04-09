using System.Collections.Generic;

namespace krasnoludki.Entities
{
    public class Map
    {
        public int SizeX { get; init; }
        public int SizeY { get; init; }

        // Zamiast jednej listy MapObjects, mamy listy konkretnych encji
        public List<House> Houses { get; set; }
        public List<Deposit> Deposits { get; set; }

        public Map(int sizeX, int sizeY)
        {
            SizeX = sizeX;
            SizeY = sizeY;
            Houses = new List<House>();
            Deposits = new List<Deposit>();
        }
    }
}