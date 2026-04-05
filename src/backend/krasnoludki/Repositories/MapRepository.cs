using krasnoludki.Entities;

namespace krasnoludki.Repositories
{
    public class MapRepository
    {
        public string GenerateImage(Map map)
        {
            // Logika renderowania mapy i zwracania np. stringa w formacie Base64 lub ścieżki
            return "sciezka_do_wygenerowanej_mapy.png";
        }

        public void AssignToMap(Map map, MapObject mapObject)
        {
            map.MapObjects.Add(mapObject);
        }
    }
}