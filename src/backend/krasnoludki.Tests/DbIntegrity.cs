using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using krasnoludki.db;
using krasnoludki.Entities;
using Dapper;
using Xunit;
using Npgsql;

namespace krasnoludki.Repositories
{
    public class DatabaseSmokeTests
    {
        [Fact]
        public async Task Database_ConnectionAndDataIntegrity_ShouldBeValid()
        {
              
           
            var connectionString = Environment.GetEnvironmentVariable("CONNECTION_STRING");
            if (string.IsNullOrEmpty(connectionString))
            {
                Environment.SetEnvironmentVariable("CONNECTION_STRING", "Host=db;Username=postgres;Password=postgres;Database=krasnoludki_db;Port=5432");
            }

            var repository = new MainRepository();
            var (dwarfs, houses, deposits) = await repository.GetDataSetupFromDB();

            Assert.NotNull(dwarfs);
            Assert.NotNull(houses);
            Assert.NotNull(deposits);
            Assert.NotEmpty(dwarfs);
            Assert.NotEmpty(houses);
            Assert.NotEmpty(deposits);

            foreach (var dwarf in dwarfs)
            {
                Assert.NotEqual<object>(Guid.Empty, dwarf.Id);
                Assert.NotNull(dwarf.Name);
                Assert.False(string.IsNullOrWhiteSpace(dwarf.Name), $"Krasnal o ID {dwarf.Id} ma pustą nazwę!");
                Assert.True(dwarf.HouseId != 0, $"Krasnal {dwarf.Name} nie ma przypisanego HouseId!");
            }

            foreach (var house in houses)
            {
                Assert.NotEqual<object>(Guid.Empty, house.Id);
            }

            foreach (var deposit in deposits)
            {
                Assert.NotEqual<object>(Guid.Empty, deposit.Id);
            }
        }
    }
}