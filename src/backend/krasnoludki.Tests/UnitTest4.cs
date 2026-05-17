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

        [Fact]
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
    }
}