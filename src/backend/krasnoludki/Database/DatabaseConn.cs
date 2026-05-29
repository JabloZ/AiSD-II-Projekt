namespace krasnoludki.db {
    using Npgsql;
    using Dapper;
    class DatabaseConn {
        public async Task<NpgsqlConnection> DbConnect() {
            var connString = Environment.GetEnvironmentVariable("CONNECTION_STRING");
            var conn = new NpgsqlConnection(connString);
            await conn.OpenAsync();
            await conn.ExecuteAsync($"SET search_path TO \"{krasnoludki.Globals.ActualDataset}\"");
        }
    }
}