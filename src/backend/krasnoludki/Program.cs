
using krasnoludki;
using krasnoludki.Api;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();
app.UseCors();

var connStr = Environment.GetEnvironmentVariable("CONNECTION_STRING") ?? "";

app.MapDataEndpoints(connStr);
app.MapDatasetEndpoints(connStr);

app.Run("http://0.0.0.0:8001");
