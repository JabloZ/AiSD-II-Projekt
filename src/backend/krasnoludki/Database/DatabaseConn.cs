namespace krasnoludki.db{
    using Npgsql;
    
    class DatabaseConn{
        public async Task<NpgsqlConnection> DbConnect(){
            
            var connString=Environment.GetEnvironmentVariable("CONNECTION_STRING");
            var conn=new NpgsqlConnection(connString);
            await conn.OpenAsync();
            using var cmd = new NpgsqlCommand($"SET search_path TO {Globals.actual_dataset};", conn);
            await cmd.ExecuteNonQueryAsync();
            return conn;
        }
    }
}