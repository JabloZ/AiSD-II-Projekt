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
        
    }
}