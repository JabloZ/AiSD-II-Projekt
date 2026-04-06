namespace krasnoludki.Entities
{
    public class Dwarf
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int Volume { get; set; }
        public bool DepositAssigned { get; set; }
        public int HouseId { get; set; }
        public int? DepositId { get; set; }

        // Właściwości nawigacyjne ułatwiające dostęp do powiązanych obiektów
        public House? House { get; set; }
        public Deposit? AssignedDeposit { get; set; }

        public Dwarf(int id, string name, int volume, int houseId, int? depositId = null)
        {
            Id = id;
            Name = name;
            Volume = volume;
            HouseId = houseId;
            DepositId = depositId;
            DepositAssigned = depositId.HasValue;
        }
    }
}