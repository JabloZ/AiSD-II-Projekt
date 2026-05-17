using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using krasnoludki.Entities;
using krasnoludki.db;

namespace krasnoludki.Repositories
{
    public class PreferenceRepository
    {
        public async Task<List<Preference>> GetPreferences()
        {
            //niedokonczone
            var Cur = new DatabaseConn();
            using var Conn = await Cur.DbConnect();
            const string Command = "SELECT dwarf_id AS DwarfId, mineral_id AS MineralId, multiplier AS Multiplier FROM Preferences";
            
            var results = await Conn.QueryAsync<Preference>(Command);
            return results.ToList();
        }
        
    }
}