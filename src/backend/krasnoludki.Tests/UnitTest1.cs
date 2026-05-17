using Xunit;

using System.Collections.Generic;
using System.Linq;
using krasnoludki.Entities;
using krasnoludki.Algorithms;
namespace krasnoludki.Tests
{
    public class AlgorithmTest1
    {
        
        [Fact]
        public void SolveAssignments_WhenValidDwarfAndValidDeposit_AssignDwarfToDeposit() 
        {
            //test przypisania krasnoluda do zloza
            var service = new AssignmentSolver();
            var house = new House {Id=100, X=0, Y=0};
            var dwarf = new Dwarf(id: 1, name: "Gimli", loudness: 10, depositAssigned: false, houseId: 100)
            {
                House=house,
                preferences = new Dictionary<int, float> {{ 1, 1.0f },{ 2, 0.0f}}
            };
            var deposit = new Deposit(id: 50, mineralId: 1, capacity: 100, x: 10, y: 20);
            var dwarfs = new List<Dwarf> { dwarf };
            var deposits = new List<Deposit> { deposit };
            service.SolveAssignments(dwarfs, deposits);
            Assert.NotNull(dwarf.Deposit);
            Assert.Equal(50, dwarf.Deposit.Id);
        }
        
        [Fact]
        public void SolveAssignments_WhenDwarfsEmpty_ReturnEmptyDictionary()
        {
            //test co jesli krasnoludy puste
            var service = new AssignmentSolver();
            var house = new House {Id=100, X=0, Y=0};
            var deposit = new Deposit(id: 50, mineralId: 1, capacity: 100, x: 10, y: 20);
            var dwarfs = new List<Dwarf> {};
            var deposits = new List<Deposit> { deposit };
            service.SolveAssignments(dwarfs, deposits);

            var exception = Record.Exception(() => service.SolveAssignments(dwarfs, deposits));
            Assert.Null(exception);
        }
        [Fact]
        public void SolveAssignments_WhenDwarfNoHouseAssigned_ExpectException()
        {
            //jak nie ma domu to ma wyrzucic blad
            var service = new AssignmentSolver();
            var dwarf = new Dwarf(1, "Bezdomny", 10, false, 1) {
                House = null,
                preferences = new Dictionary<int, float> {{ 1, 1.0f }}
            };
            var deposit = new Deposit(50, 1, 10, 0, 0);

            var exception = Record.Exception(() => service.SolveAssignments(new List<Dwarf>{dwarf}, new List<Deposit>{deposit}));
            
            Assert.Null(exception);
            Assert.False(dwarf.DepositAssigned);
        }
        [Fact]
        public void SolveAssignments_WhenDepositsEmpty_ReturnEmptyDictionary()
        {
            //test co jelsi kopalnie puste
            var service = new AssignmentSolver();
            var house = new House {Id=100, X=0, Y=0};
            var dwarf = new Dwarf(id: 1, name: "Gimli", loudness: 10, depositAssigned: false, houseId: 100)
            {
                House=house,
                preferences = new Dictionary<int, float> {{ 1, 1.0f },{ 2, 0.0f}}
            };
            var dwarfs = new List<Dwarf> { dwarf };
            var deposits = new List<Deposit> {};
            service.SolveAssignments(dwarfs, deposits);
            var exception = Record.Exception(() => service.SolveAssignments(dwarfs, deposits));
            Assert.Null(exception);
        }
        [Fact]
        public void SolveAssignments_DepositsFullCapacity_DontAssignDwarf()
        {
            var service = new AssignmentSolver();
            var house = new House {Id=100, X=0, Y=0};
            var dwarf = new Dwarf(id: 1, name: "Gimli", loudness: 10, depositAssigned: false, houseId: 100)
            {
                House=house,
                preferences = new Dictionary<int, float> {{ 1, 1.0f },{ 2, 0.0f}}
            };
            
            var deposit = new Deposit(id: 50, mineralId: 1, capacity: 0, x: 10, y: 20);
            var dwarfs = new List<Dwarf> { dwarf };
            var deposits = new List<Deposit> { deposit };
            service.SolveAssignments(dwarfs, deposits);
            Assert.Equal(0, deposit.Capacity);
            Assert.False(dwarf.DepositAssigned);
            Assert.Null(dwarf.Deposit);
        }
       
        [Fact]
        public void SolveAssignments_BothDwarfsHaveSamePreferences_CloserDwarfAssigned()
        {
            var service = new AssignmentSolver();
            var house = new House {Id=100, X=0, Y=0};
            var dwarf = new Dwarf(id: 1, name: "Gimli", loudness: 10, depositAssigned: false, houseId: 100)
            {
                House=house,
                preferences = new Dictionary<int, float> {{ 1, 1.0f },{ 2, 0.0f}}
            };
            //ten krasnolud jest blizej
            var house2 = new House {Id=101, X=1, Y=1};
            var dwarf2 = new Dwarf(id: 2, name: "Gimligingi", loudness: 10, depositAssigned: false, houseId: 101)
            {
                House=house2,
                preferences = new Dictionary<int, float> {{ 1, 1.0f },{ 2, 0.0f}}
            };
            var deposit = new Deposit(id: 50, mineralId: 1, capacity: 1, x: 10, y: 20);
            var dwarfs = new List<Dwarf> { dwarf,dwarf2 };
            var deposits = new List<Deposit> { deposit };
            service.SolveAssignments(dwarfs, deposits);
            Assert.False(dwarf.DepositAssigned);
            Assert.True(dwarf2.DepositAssigned);
            Assert.Null(dwarf.Deposit);
            Assert.NotNull(dwarf2.Deposit);
        }
        [Fact]
        public void SolveAssignments_DwarfDepositAssignedButBetterDepositAvailable_AssignDwarf()
        {
            //podmien kopalnie krasnoluda jesli jest jakas bardziej optymalna dla niego
            var service = new AssignmentSolver();
            var house = new House {Id=100, X=0, Y=0};
            var deposit_og = new Deposit(id: 49, mineralId: 1, capacity: 1, x: 100, y: 20);
            var dwarf = new Dwarf(id: 1, name: "Gimli", loudness: 10, depositAssigned: true, houseId: 100)
            {
                House=house,
                Deposit=deposit_og,
                preferences = new Dictionary<int, float> {{ 1, 1.0f },{ 2, 0.0f}}
            };
          
            var deposit = new Deposit(id: 50, mineralId: 1, capacity: 1, x: 10, y: 20);
            var dwarfs = new List<Dwarf> { dwarf};
            var deposits = new List<Deposit> { deposit };
            service.SolveAssignments(dwarfs, deposits);
            Assert.Equal(50,dwarf.Deposit.Id);
        }
        [Fact]
        public void SolveAssignments_DwarfHasOnlyOneValidOptionAmongMany_AssignsToCorrectOne()
        {
            //wybierze blizsza czy z lepszym surowcem
            var service = new AssignmentSolver();
            var house = new House {Id=1, X=0, Y=0};
            var dwarf = new Dwarf(1, "Gimli", 10, false, 1) {
                House = house,
                preferences = new Dictionary<int, float> {{ 1, 1.0f }}
            };
            
            var depBad = new Deposit(50, mineralId: 99, capacity: 10, x: 1, y: 1); // nie jego mineral
            var depGood = new Deposit(51, mineralId: 1, capacity: 10, x: 100, y: 100);
            
            service.SolveAssignments(new List<Dwarf>{dwarf}, new List<Deposit>{depBad, depGood});

            Assert.Equal(51, dwarf.Deposit.Id);
        }
         //[Fact]
        //problem - opisany na discordzie na problemy-pytania
        /*public void SolveAssignments_DwarfAndDepositDifferentMinerals_DontAssignDwarf()
        {
            var service = new AssignmentSolver();
            var house = new House {Id=100, X=0, Y=0};
            var dwarf = new Dwarf(id: 1, name: "Gimli", loudness: 10, depositAssigned: false, houseId: 100)
            {
                House=house,
                preferences = new Dictionary<int, float> {{ 1, 1.0f },{ 2, 0.0f}}
            };
            
            var deposit = new Deposit(id: 50, mineralId: 2, capacity: 1, x: 10, y: 20);
            var dwarfs = new List<Dwarf> { dwarf };
            var deposits = new List<Deposit> { deposit };
            service.SolveAssignments(dwarfs, deposits);
            Assert.Equal(1, deposit.Capacity);
            Assert.False(dwarf.DepositAssigned);
            Assert.Null(dwarf.Deposit);
        }*/
    }
}