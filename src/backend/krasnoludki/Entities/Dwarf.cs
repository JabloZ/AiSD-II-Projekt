namespace krasnoludki.Entities
{
    public class Dwarf
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int Volume { get; set; }
        public bool DepositAssigned { get; set; }
        
        // Relacje z diagramu
        public Preference Preference { get; set; }
        public House House { get; set; }
        public Deposit? AssignedDeposit { get; set; }

        public Dwarf(int id, string name, int volume, Preference preference, House house)
        {
            Id = id;
            Name = name;
            Volume = volume;
            Preference = preference;
            House = house;
            DepositAssigned = false;
        }
    }
}