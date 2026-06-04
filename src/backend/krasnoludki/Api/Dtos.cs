namespace krasnoludki.Api;

record MineralRow(int Id, string Name);
record SetupDwarfDto(string Id, string Name, List<string> MineralPreferences);
record SetupHouseDto(string Id, double X, double Y, string? Name, List<SetupDwarfDto> Dwarfs);
record SetupMineDto(string Id, double X, double Y, string? Mineral, string? MineralType, int Capacity);
record SetupBorderPointDto(double X, double Y);
record SetupBodyDto(List<SetupBorderPointDto> Border, List<SetupHouseDto> Houses, List<SetupMineDto> Mines);
record HouseDto(string Id, double X, double Y, int DwarfCount,
                List<string> MineralPreferences, List<string>? DwarfNames = null,
                List<List<string>>? DwarfPreferences = null);
record MineDto(string Id, double X, double Y, string MineralType, int Capacity);
record AssignRequestDto(List<HouseDto> Houses, List<MineDto> Mines);
record AssignmentDto(string HouseId, string MineId, int Count, double Distance);
record AssignResultDto(List<AssignmentDto> Assignments, List<string> Logs, double TotalDistance);
record CreateDatasetDto(string Label);
record ScanLogsDto(string Text, List<string> Patterns);