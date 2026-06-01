namespace krasnoludki.Api;

using krasnoludki.Algorithms;

public static class LogsEndpoints
{
    public static void MapLogsEndpoints(this WebApplication app)
    {
        // POST /api/logs/compressed
        // Body: { "logs": "tekst logów..." }
        // Zwraca: plik binarny .huff + nagłówki X-Huffman-* ze statystykami
        app.MapPost("/api/logs/compressed", (CompressLogsDto req, HttpResponse res) =>
        {
            if (string.IsNullOrWhiteSpace(req.Logs))
                return Results.BadRequest(new { error = "Brak tekstu logów." });

            try
            {
                var solver = new HuffmanSolver();
                solver.BuildTree(req.Logs);

                string encoded  = solver.Encode(req.Logs);
                byte[] huffData = solver.SerializeToHuff(req.Logs);

                int    originalBits = req.Logs.Length * 8;
                int    encodedBits  = encoded.Length;
                double savedPct     = 100.0 - ((double)encodedBits / originalBits * 100);

                res.Headers.Append("X-Huffman-Original-Bits", originalBits.ToString());
                res.Headers.Append("X-Huffman-Encoded-Bits",  encodedBits.ToString());
                res.Headers.Append("X-Huffman-Saved-Percent", savedPct.ToString("F2"));
                res.Headers.Append("X-Huffman-File-Bytes",    huffData.Length.ToString());
                res.Headers.Append("Access-Control-Expose-Headers",
                    "X-Huffman-Original-Bits,X-Huffman-Encoded-Bits,X-Huffman-Saved-Percent,X-Huffman-File-Bytes");

                return Results.File(huffData, "application/octet-stream", "logi.huff");
            }
            catch (Exception ex)
            {
                return Results.Problem(ex.Message);
            }
        });

        // POST /api/logs/decompress
        // Body: multipart/form-data, pole "file" (.huff)
        // Zwraca: { text, stats }
        app.MapPost("/api/logs/decompress", async (IFormFile? file) =>
        {
            if (file == null || file.Length == 0)
                return Results.BadRequest(new { error = "Brak pliku." });

            if (!file.FileName.EndsWith(".huff", StringComparison.OrdinalIgnoreCase))
                return Results.BadRequest(new { error = "Oczekiwano pliku .huff" });

            try
            {
                using var ms = new MemoryStream();
                await file.CopyToAsync(ms);
                byte[] data = ms.ToArray();

                string decoded = HuffmanSolver.DeserializeFromHuff(data);

                int originalBits = decoded.Length * 8;
                int encodedBits  = decoded.Length > 0
                    ? (int)(data.Length * 8 * 0.7)  // przybliżenie — nagłówek zajmuje część pliku
                    : 0;

                return Results.Ok(new
                {
                    text  = decoded,
                    stats = new
                    {
                        fileSizeBytes = data.Length,
                        originalChars = decoded.Length,
                        originalBits,
                        encodedBits,
                        savedPercent  = originalBits > 0
                            ? (100.0 - ((double)encodedBits / originalBits * 100)).ToString("F1")
                            : "0",
                    }
                });
            }
            catch (InvalidDataException ex)
            {
                return Results.BadRequest(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                return Results.Problem(ex.Message);
            }
        }).DisableAntiforgery();
    }
}

record CompressLogsDto(string Logs);