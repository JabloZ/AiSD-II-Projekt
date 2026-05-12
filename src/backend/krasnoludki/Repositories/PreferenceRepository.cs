using System;
using System.Collections.Generic;
using System.IO;
using System.Globalization;
using System.Threading.Tasks;
using krasnoludki.Entities;

namespace krasnoludki.Repositories
{
    public class PreferenceRepository
    {
        private const string PreferencesFilePath = "test_data/preferences.csv";

        public async Task<List<Preference>> GetPreferences()
        {
            string[] lines = await File.ReadAllLinesAsync(PreferencesFilePath);
            List<Preference> preferences = new List<Preference>();

            for (int i = 1; i < lines.Length; i++)
            {
                string[] columns = lines[i].Split(',');

                Preference p = new Preference
                {
                    DwarfId = int.Parse(columns[0]),
                    MineralId = int.Parse(columns[1]),
                    Multiplier = double.Parse(columns[2], CultureInfo.InvariantCulture)
                };

                preferences.Add(p);
            }

            return preferences;
        }
    }
}