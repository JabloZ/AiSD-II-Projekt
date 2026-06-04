using Xunit;

using System.Collections.Generic;
using krasnoludki.Algorithms;

namespace krasnoludki.Tests
{
    public class UnitTest5
    {
        [Fact]
        public void Search_WhenPatternsExistInText_ReturnsCorrectCounts()
        {
            //test wyszukiwania wielu haseł w logach
            var service = new LogAnalyzerSolver();
            var patterns = new List<string> { "jablko", "szmugiel" };
            service.BuildAutomaton(patterns);

            string text = "tajny szmugiel, przechwycono jablko i znowu wielki szmugiel";
            var results = service.Search(text);

            Assert.True(results.ContainsKey("szmugiel"));
            Assert.Equal(2, results["szmugiel"].Count); 
            Assert.True(results.ContainsKey("jablko"));
            Assert.Equal(1, results["jablko"].Count);
        }

        [Fact]
        public void Search_WhenPatternsDoNotExist_ReturnsEmptyDictionary()
        {
            //test braku wyników dla czystego tekstu
            var service = new LogAnalyzerSolver();
            service.BuildAutomaton(new List<string> { "goblin" });

            string text = "tutaj sa tylko krasnoludki i kopalnie";
            var results = service.Search(text);

            Assert.False(results.ContainsKey("goblin"));
        }
        
        [Fact]
        public void Search_WhenOverlappingPatterns_FindsBoth()
        {
            //test nakładających sie wzorców z linkami Fail
            var service = new LogAnalyzerSolver();
            service.BuildAutomaton(new List<string> { "he", "she", "his", "hers" });

            string text = "ushers";
            var results = service.Search(text);

            Assert.True(results.ContainsKey("she"));
            Assert.True(results.ContainsKey("he"));
            Assert.True(results.ContainsKey("hers"));
            Assert.False(results.ContainsKey("his"));
        }

        [Fact]
        public void Search_WhenDifferentCase_FindsMatchesCaseInsensitively()
        {
            // test sprawdzający odporność na wielkość liter (Case Insensitivity)
            var service = new LogAnalyzerSolver();
            service.BuildAutomaton(new List<string> { "Szmugiel", "rEnEtA" }); // Pomieszana wielkość w hasłach

            // Pomieszana wielkość liter w przeszukiwanym tekście
            string text = "Nocny sZmuGieL owoców, pyszna reneta oraz kolejny SZMUGIEL.";
            var results = service.Search(text);

            Assert.True(results.ContainsKey("Szmugiel"));
            Assert.Equal(2, results["Szmugiel"].Count); 
            
            Assert.True(results.ContainsKey("rEnEtA"));
            Assert.Equal(1, results["rEnEtA"].Count);
        }
    }
}