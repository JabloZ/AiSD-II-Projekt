using Xunit;

using System.Collections.Generic;
using krasnoludki.Entities;
using krasnoludki.Algorithms;

namespace krasnoludki.Tests
{
    public class UnitTest3
    {
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