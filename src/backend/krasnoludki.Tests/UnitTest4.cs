
using Xunit;
using System;
using System.Collections.Generic;
using System.Linq;
using krasnoludki.Algorithms;

namespace krasnoludki.Tests
{
    public class HuffmanSolverTests
    {
        [Fact]
        public void EncodeAndDecode_WhenValidText_ReturnsOriginalText()
        {
            var solver = new HuffmanSolver();
            string text = "krasnoludki";

            solver.BuildTree(text);
            string encoded = solver.Encode(text);
            string decoded = solver.Decode(encoded);

            Assert.Equal(text, decoded);
            Assert.False(string.IsNullOrEmpty(encoded));
            Assert.True(encoded.All(c => c == '0' || c == '1'));
        }

        [Fact]
        public void Encode_WhenTreeNotBuilt_ThrowsException()
        {
            var solver = new HuffmanSolver();
            string text = "test";

            var exception = Record.Exception(() => solver.Encode(text));

            Assert.NotNull(exception);
            Assert.Contains("Drzewo nie zostało zbudowane", exception.Message);
        }

        [Fact]
        public void Decode_WhenTreeNotBuilt_ThrowsException()
        {
            var solver = new HuffmanSolver();
            string bits = "0101";

            var exception = Record.Exception(() => solver.Decode(bits));

            Assert.NotNull(exception);
            Assert.Contains("Drzewo nie zostało zbudowane", exception.Message);
        }

        [Fact]
        public void BuildTree_WhenTextIsEmpty_DoesNotThrowException()
        {
            var solver = new HuffmanSolver();
            string text = "";

            var exception = Record.Exception(() => solver.BuildTree(text));

            Assert.Null(exception);
        }

       // [Fact]
        //chwilowo nie dziala

        /*public void EncodeAndDecode_WhenSingleRepeatedCharacter_HandlesCorrectly()
        {
            var solver = new HuffmanSolver();
            string text = "aaaaa";

            solver.BuildTree(text);
            string encoded = solver.Encode(text);
            string decoded = solver.Decode(encoded);

            Assert.Equal(text, decoded);
        }*/

        [Fact]
        public void Encode_WhenFrequentCharacters_AssignsShorterCodes()
        {
            var solver = new HuffmanSolver();
            string text = "aaaaabbc";

            solver.BuildTree(text);
            string encodedA = solver.Encode("a");
            string encodedC = solver.Encode("c");

            Assert.True(encodedA.Length <= encodedC.Length);
        }
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
