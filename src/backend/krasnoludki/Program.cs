﻿
using krasnoludki;
using krasnoludki.Api;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(p => p
        .AllowAnyOrigin()
        .AllowAnyMethod()
        .AllowAnyHeader()
        .WithExposedHeaders(
            "X-Huffman-Original-Bits",
            "X-Huffman-Encoded-Bits",
            "X-Huffman-Saved-Percent",
            "X-Huffman-File-Bytes"
        ));
});

var app = builder.Build();
app.UseCors();

var connStr = Environment.GetEnvironmentVariable("CONNECTION_STRING") ?? "";

app.MapDataEndpoints(connStr);
app.MapDatasetEndpoints(connStr);
app.MapLogsEndpoints();

app.Run("http://0.0.0.0:8001");