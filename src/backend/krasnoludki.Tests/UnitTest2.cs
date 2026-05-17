using Xunit;
using System.Collections.Generic;
using System.Linq;
using krasnoludki.Entities;
using krasnoludki.Algorithms;

namespace krasnoludki.Tests
{
    public class PatrolSolverTests
    {
        [Fact]
        public void FindPatrolRoute_WhenValidHousesAndDeposits_ReturnsCorrectConvexHull()
        {
            //test wyrzucenia srodkowego punktu
            var service = new PatrolSolver();
            var houses = new List<House>
            {
                new House { Id = 1, X = 0, Y = 0 },
                new House { Id = 2, X = 10, Y = 0 }
            };
            var deposits = new List<Deposit>
            {
                new Deposit(id: 1, mineralId: 1, capacity: 10, x: 10, y: 10),
                new Deposit(id: 2, mineralId: 1, capacity: 10, x: 0, y: 10),
                new Deposit(id: 3, mineralId: 1, capacity: 10, x: 5, y: 5)  //ten wywalont powinien byc
            };

            var route = service.FindPatrolRoute(houses, deposits);
            Assert.Equal(4, route.Count);
            Assert.DoesNotContain(route, p => p.Name.Contains("Kopalnia 3"));
        }

        [Fact]
        public void FindPatrolRoute_WhenHousesEmpty_ReturnsRouteFromDepositsOnly()
        {
            //jesli sa same kopalnie
            var service = new PatrolSolver();
            var houses = new List<House>();
            var deposits = new List<Deposit>
            {
                new Deposit(1, 1, 10, 0, 0),
                new Deposit(2, 1, 10, 5, 5),
                new Deposit(3, 1, 10, 10, 10)
            };

            var exception = Record.Exception(() => service.FindPatrolRoute(houses, deposits));
            
            Assert.Null(exception);
            var route = service.FindPatrolRoute(houses, deposits);
            Assert.NotEmpty(route);
        }

        [Fact]
        public void FindPatrolRoute_WhenDepositsEmpty_ReturnsRouteFromHousesOnly()
        {
            //jesli nie ma kopalni
            var service = new PatrolSolver();
            var houses = new List<House>
            {
                new House { Id = 1, X = 0, Y = 0 },
                new House { Id = 2, X = 5, Y = 5 }
            };
            var deposits = new List<Deposit>();

            var exception = Record.Exception(() => service.FindPatrolRoute(houses, deposits));

            Assert.Null(exception);
            var route = service.FindPatrolRoute(houses, deposits);
            Assert.Equal(2, route.Count);
        }

        [Fact]
        public void FindPatrolRoute_LessThanThreePointsTotal_ReturnsAllPoints()
        {
            //kiedy sa tylko 2 punkty to otoczka sa te dwa punkty, nic nie odrzuca
            var service = new PatrolSolver();
            var houses = new List<House> { new House { Id = 1, X = 0, Y = 0 } };
            var deposits = new List<Deposit> { new Deposit(1, 1, 10, 10, 10) };

            var route = service.FindPatrolRoute(houses, deposits);

            Assert.Equal(2, route.Count);
        }

        [Fact]
        public void FindPatrolRoute_WhenPointsAreCollinear_ReturnsOnlyExtremePoints()
        {
            //test wyrzucenia srodkowego punktu
            var service = new PatrolSolver();
            var houses = new List<House>
            {
                new House { Id = 1, X = 0, Y = 0 },
                new House { Id = 2, X = 5, Y = 5 }
            };
            var deposits = new List<Deposit>
            {
                new Deposit(1, 1, 10, 10, 10)
            };

            var route = service.FindPatrolRoute(houses, deposits);
            Assert.True(route.Count < 3);
            Assert.DoesNotContain(route, p => p.Name.Contains("Domek 2"));
        }

        [Fact]
        public void FindPatrolRoute_WhenMultiplePointsAtSamePosition_HandlesGracefully()
        {
            //nakladajace sie wspolrzedne
            var service = new PatrolSolver();
            var houses = new List<House>
            {
                new House { Id = 1, X = 0, Y = 0 },
                new House { Id = 2, X = 0, Y = 0 }
            };
            var deposits = new List<Deposit>
            {
                new Deposit(1, 1, 10, 10, 10),
                new Deposit(2, 1, 10, 0, 10)
            };

            var exception = Record.Exception(() => service.FindPatrolRoute(houses, deposits));
            
            Assert.Null(exception);
            var route = service.FindPatrolRoute(houses, deposits);
            Assert.NotEmpty(route);
        }
    }
}