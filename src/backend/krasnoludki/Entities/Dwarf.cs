namespace krasnoludki.Entities
{
    public class Dwarf
    {
        public int Id { get; init; }
        public string Name { get; init; }
        public int Loudness { get; init; }
        public int HouseId { get; init; }
        
        // DepositId może być zmieniane tylko wewnątrz projektu (np. przez algorytm)
        public int? DepositId { get; internal set; } 
        
        // Właściwość wyliczana w locie - nie potrzebuje osobnego pola w pamięci
        public bool DepositAssigned => DepositId.HasValue; 

        // Właściwości nawigacyjne
        public House? House { get; set; }
        public Deposit? AssignedDeposit { get; internal set; }

        public Dwarf(int id, string name, int loudness, int houseId, int? depositId = null)
        {
            Id = id;
            Name = name;
            Loudness = loudness;
            HouseId = houseId;
            DepositId = depositId;
        }
    }
}