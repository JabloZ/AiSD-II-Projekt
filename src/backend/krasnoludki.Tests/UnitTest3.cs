
using Xunit;
using System;
using System.Collections.Generic;
using krasnoludki.Entities;
using krasnoludki.Algorithms;

namespace krasnoludki.Tests
{
    public class BorderDefenseSolverTests
    {
        [Fact]
        public void BorderDefenseSolver_WhenValidSegment_ReturnsLoudestDwarf()
        {
            var house = new House { Id = 100, X = 0, Y = 0 };
            var dwarf1 = new Dwarf(1, "Gimli", 10, false, 100) { House = house };
            var dwarf2 = new Dwarf(2, "Gloin", 50, false, 100) { House = house };
            var dwarf3 = new Dwarf(3, "Balin", 30, false, 100) { House = house };
            
            var dwarves = new List<Dwarf> { dwarf1, dwarf2, dwarf3 };
            var solver = new BorderDefenseSolver(dwarves);

            var commander = solver.GetCommanderForSegment(0, 2);

            Assert.NotNull(commander);
            Assert.Equal(2, commander.Id);
            Assert.Equal(50, commander.Loudness);
        }

        [Fact]
        public void BorderDefenseSolver_WhenDwarvesListIsEmpty_ReturnsNull()
        {
            var dwarves = new List<Dwarf>();
            var solver = new BorderDefenseSolver(dwarves);

            var exception = Record.Exception(() => solver.GetCommanderForSegment(0, 0));

            Assert.Null(exception);
            var commander = solver.GetCommanderForSegment(0, 0);
            Assert.Null(commander);
        }

        [Fact]
        public void BorderDefenseSolver_WhenSegmentIndicesAreInvalid_ReturnsNull()
        {
            var house = new House { Id = 100, X = 0, Y = 0 };
            var dwarf = new Dwarf(1, "Gimli", 10, false, 100) { House = house };
            
            var dwarves = new List<Dwarf> { dwarf };
            var solver = new BorderDefenseSolver(dwarves);

            var resultOutLeft = solver.GetCommanderForSegment(-1, 0);
            var resultOutRight = solver.GetCommanderForSegment(0, 5);
            var resultSwapped = solver.GetCommanderForSegment(2, 0);

            Assert.Null(resultOutLeft);
            Assert.Null(resultOutRight);
            Assert.Null(resultSwapped);
        }

        [Fact]
        public void BorderDefenseSolver_WhenSubSegmentRequested_ReturnsLoudestInThatSubSegment()
        {
            var house = new House { Id = 100, X = 0, Y = 0 };
            var dwarf0 = new Dwarf(0, "Thorin", 90, false, 100) { House = house };
            var dwarf1 = new Dwarf(1, "Dwalin", 20, false, 100) { House = house };
            var dwarf2 = new Dwarf(2, "Fili", 40, false, 100) { House = house };
            var dwarf3 = new Dwarf(3, "Kili", 15, false, 100) { House = house };

            var dwarves = new List<Dwarf> { dwarf0, dwarf1, dwarf2, dwarf3 };
            var solver = new BorderDefenseSolver(dwarves);

            var commander = solver.GetCommanderForSegment(1, 3);

            Assert.NotNull(commander);
            Assert.Equal(2, commander.Id);
            Assert.Equal(40, commander.Loudness);
        }

        [Fact]
        public void BorderDefenseSolver_WhenDwarvesHaveEqualLoudness_ReturnsFirstOneDueToGreaterOrEqualSign()
        {
            var house = new House { Id = 100, X = 0, Y = 0 };
            var dwarf0 = new Dwarf(0, "Bofur", 30, false, 100) { House = house };
            var dwarf1 = new Dwarf(1, "Bifur", 30, false, 100) { House = house };
            var dwarf2 = new Dwarf(2, "Bombur", 30, false, 100) { House = house };

            var dwarves = new List<Dwarf> { dwarf0, dwarf1, dwarf2 };
            var solver = new BorderDefenseSolver(dwarves);

            var commander = solver.GetCommanderForSegment(0, 2);

            Assert.NotNull(commander);
            Assert.Equal(0, commander.Id);
        }

        [Fact]
        public void BorderDefenseSolver_SingleElementSegment_ReturnsThatElement()
        {
            var house = new House { Id = 100, X = 0, Y = 0 };
            var dwarf0 = new Dwarf(0, "Oin", 10, false, 100) { House = house };
            var dwarf1 = new Dwarf(1, "Gloin", 85, false, 100) { House = house };

            var dwarves = new List<Dwarf> { dwarf0, dwarf1 };
            var solver = new BorderDefenseSolver(dwarves);

            var commander = solver.GetCommanderForSegment(1, 1);

            Assert.NotNull(commander);
            Assert.Equal(1, commander.Id);
            Assert.Equal(85, commander.Loudness);
        }
        [Fact]
        public void GetCommanderForSegment_WhenSegmentGiven_ReturnDwarfWithMaxLoudness()
        {
            //test wyboru najglośniejszego krasnoluda na danym odcinku
            var dwarves = new List<Dwarf>
            {
                new Dwarf(1, "Kamin", 70, false, 1),
                new Dwarf(2, "Zorak", 30, false, 2),
                new Dwarf(3, "Karoz", 40, false, 2)
            };
            var service = new BorderDefenseSolver(dwarves);
            
            var commanderLeft = service.GetCommanderForSegment(0, 1); 
            var commanderRight = service.GetCommanderForSegment(1, 2); 
            var commanderAll = service.GetCommanderForSegment(0, 2); 

            Assert.NotNull(commanderLeft);
            Assert.Equal("Kamin", commanderLeft.Name);

            Assert.NotNull(commanderRight);
            Assert.Equal("Karoz", commanderRight.Name);

            Assert.NotNull(commanderAll);
            Assert.Equal("Kamin", commanderAll.Name);
        }

        [Fact]
        public void GetCommanderForSegment_WhenBorderEmpty_ReturnNull()
        {
            //co jesli nikogo nie ma na granicy
            var dwarves = new List<Dwarf>();
            var service = new BorderDefenseSolver(dwarves);

            var commander = service.GetCommanderForSegment(0, 5);

            Assert.Null(commander);
        }

        [Fact]
        public void GetCommanderForSegment_WhenIndicesOutOfRange_ReturnNull()
        {
            //co jeśli sprawdzamy indeksy poza tablicą krasnoludów
            var dwarves = new List<Dwarf>
            {
                new Dwarf(1, "Kamin", 70, false, 1)
            };
            var service = new BorderDefenseSolver(dwarves);

            var commander = service.GetCommanderForSegment(-1, 5);

            Assert.Null(commander);
        }
    }
}
