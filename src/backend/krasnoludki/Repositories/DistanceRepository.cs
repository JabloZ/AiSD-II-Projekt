using krasnoludki.Entities;
using System;

namespace krasnoludki.Repositories
{
    public class DistanceRepository
    {
        public int ObliczSciezke(House house, Deposit deposit)
        {
            // Obliczenie dystansu np. metodą euklidesową lub Manhattan
            int diffX = house.LocationX - deposit.LocationX;
            int diffY = house.LocationY - deposit.LocationY;
            return (int)Math.Sqrt((diffX * diffX) + (diffY * diffY));
        }
    }
}