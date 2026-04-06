namespace krasnoludki.db{
    using Npgsql;
    class DatabaseConn{
        public async Task<NpgsqlConnection> DbConnect(){
            
            var connString=Environment.GetEnvironmentVariable("CONNECTION_STRING");
            var conn=new NpgsqlConnection(connString);
            await conn.OpenAsync();
            return conn;
        }
    }
}