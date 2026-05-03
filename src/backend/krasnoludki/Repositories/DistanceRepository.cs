using System;
using krasnoludki.Entities;

namespace krasnoludki.Repositories
{
    public class DistanceRepository
    {
        // Metoda może być statyczna, bo tylko przelicza dane wejściowe
        public static double CalculateDistance(House house, Deposit deposit)
        {
            int diffX = house.X - deposit.X;
            int diffY = house.Y - deposit.Y;
            return Math.Sqrt((diffX * diffX) + (diffY * diffY));
        }
    }
}