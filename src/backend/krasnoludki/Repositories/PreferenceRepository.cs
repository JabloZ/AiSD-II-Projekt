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
            var Cur = new DatabaseConn();
            using var Conn = await Cur.DbConnect();
            const string Command = "SELECT * from Houses";
            var Preferences = await Conn.QueryAsync<Preference>(Command);
            return Preferences.ToList();
        }
        
    }
}