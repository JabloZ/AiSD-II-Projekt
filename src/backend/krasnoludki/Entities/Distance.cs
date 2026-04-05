namespace krasnoludki.Entities
{
    public class Distance
    {
        public int Length { get; set; }
        public House StartHouse { get; set; }
        public Deposit EndDeposit { get; set; }

        public Distance(House startHouse, Deposit endDeposit, int length)
        {
            StartHouse = startHouse;
            EndDeposit = endDeposit;
            Length = length;
        }
    }
}