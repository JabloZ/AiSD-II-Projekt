using System;
using krasnoludki.Entities;

namespace krasnoludki.Repositories
{
    public class DistanceRepository
    {
        public int CalculateDistance(House house, Deposit deposit)
        {
            // Korzystamy bezpośrednio ze współrzędnych x i y
            int diffX = house.X - deposit.X;
            int diffY = house.Y - deposit.Y;
            return (int)Math.Sqrt((diffX * diffX) + (diffY * diffY));
        }
    }
}