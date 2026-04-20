using krasnoludki.db;
using Dapper;
using krasnoludki.Entities;

namespace krasnoludki.Repositories
{
    public class PreferenceRepository
    {
        public async Task<List<Preference>> GetPreferences()
        {
            //niedokonczone
            var cur = new DatabaseConn();
            using var conn = await cur.DbConnect();
            const string command = "SELECT * from Houses";
            var preferences = await conn.QueryAsync<Preference>(command);
            return preferences.ToList();
        }
        
    }
}