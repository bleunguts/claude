using System.ComponentModel;
using System.Globalization;
using System.Text.Json;
using ModelContextProtocol.Server;

namespace QuickstartWeatherSserver.Tools;

[McpServerToolType]
public sealed class WeatherTools
{
    [McpServerTool, Description("Get active weather alerts for a given US state code.")]
    public static async Task<string> GetAlerts(
        HttpClient client,
        [Description("The US state code to get alerts for.")] string state)    
    {
        try
        {
            var url = $"/alerts/active/area/{state}";
            Console.WriteLine($"[GetAlerts] Requesting: {client.BaseAddress}{url.TrimStart('/')}");
            using var jsonDocument = await client.ReadJsonDocumentAsync(url);
            
            var jsonElement = jsonDocument.RootElement;
            var alerts = jsonElement.GetProperty("features").EnumerateArray();

            if(!alerts.Any())
            {
                return "No active alerts for this state.";
            }

            return string.Join("\n--\n", alerts.Select(alert =>
            {
                JsonElement properties = alert.GetProperty("properties");
                return $"""
                        Event: {properties.GetProperty("event").GetString()}
                        Area: {properties.GetProperty("areaDesc").GetString()}
                        Severity: {properties.GetProperty("severity").GetString()}  
                        Description: {properties.GetProperty("description").GetString()}
                        Instruction: {properties.GetProperty("instruction").GetString()}    
                        """;
            }));
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"Error fetching alerts for {state}: {ex.Message}");
            throw;
        }
    }

    [McpServerTool, Description("Get weather forecast for a given location.")]
    public static async Task<string> GetForecast(
        HttpClient client,
        [Description("Latitude of the location.")] string latitude,
        [Description("Longitude of the location.")] string longitude)
    {
        var pointUrl = string.Create(CultureInfo.InstalledUICulture, $"/points/{latitude},{longitude}");
        using var jsonDocument = await client.ReadJsonDocumentAsync(pointUrl);  
        var forecastUrl = jsonDocument.RootElement.GetProperty("properties").GetProperty("forecast").GetString()
            ?? throw new Exception($"No forecast URL provided by {client.BaseAddress}points/{latitude},{longitude}");

        using var forecastDocument = await client.ReadJsonDocumentAsync(forecastUrl);
        var periods = forecastDocument.RootElement.GetProperty("properties").GetProperty("periods").EnumerateArray();

        return string.Join("\n--\n", periods.Select(period =>
        {
            return $"""
                    {period.GetProperty("name").GetString()}
                    Temperature: {period.GetProperty("temperature").GetInt32()} {period.GetProperty("temperature").GetInt32()}°F
                    Wind: {period.GetProperty("windSpeed").GetString()} {period.GetProperty("windDirection").GetString()}
                    Short Forecast: {period.GetProperty("shortForecast").GetString()}
                    Detailed Forecast: {period.GetProperty("detailedForecast").GetString()}
                    """;
        }));
    }
}