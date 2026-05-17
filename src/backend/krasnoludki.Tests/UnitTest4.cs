using Xunit;

using krasnoludki.Algorithms;

namespace krasnoludki.Tests
{
    public class UnitTest4
    {
        [Fact]
        public void EncodeAndDecode_WhenSingleRepeatedCharacter_HandlesCorrectly()
        {
            //test naprawionego błędu dla 1 znaku (np. aaaaa)
            var service = new HuffmanSolver();
            string text = "aaaaa";

            service.BuildTree(text);
            string encoded = service.Encode(text);
            string decoded = service.Decode(encoded);

            Assert.Equal(text, decoded);
            Assert.True(encoded.Length > 0);
        }

        [Fact]
        public void EncodeAndDecode_WhenNormalReportText_MatchesOriginalText()
        {
            //test zwykłego raportu o jabłkach
            var service = new HuffmanSolver();
            string text = "reneta, antonowka, ligol, reneta";

            service.BuildTree(text);
            string encoded = service.Encode(text);
            string decoded = service.Decode(encoded);

            Assert.Equal(text, decoded);
        }

        [Fact]
        public void Encode_WhenTreeNotBuilt_ExpectException()
        {
            //jak nie zbudowano drzewa to ma wyrzucić błąd przy kodowaniu
            var service = new HuffmanSolver();
            string text = "antonowka";

            var exception = Record.Exception(() => service.Encode(text));
            
            Assert.NotNull(exception);
            Assert.Equal("Drzewo nie zostało zbudowane! Uruchom BuildTree.", exception.Message);
        }
    }
}