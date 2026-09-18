using System.ComponentModel;
using ClaudeAgentSdk;
using Microsoft.Extensions.AI;

// No ANTHROPIC_API_KEY needed — auth comes from the Claude Code CLI's own
// login session (`claude login`), which rides your Pro subscription, not
// Console pay-as-you-go credits.

Console.WriteLine("=== Tool Runner Example (ported to claude-agent-sdk-dotnet / CLI auth) ===\n");
Console.WriteLine("Ask: What's the weather in Paris right now, and how much is €100 in USD?\n");

// --- Define tools -----------------------------------------------------
// Original ToolRunnerExample used BetaRunnableTool + a hand-written
// JSON input schema. This wrapper instead takes plain C# methods/lambdas
// via Microsoft.Extensions.AI's AIFunctionFactory, which infers the schema
// from the parameter types and [Description] attributes.

var weatherTool = AIFunctionFactory.Create(
    ([Description("City name")] string city) =>
    {
        Console.WriteLine($"  [tool] get_weather(city={city})");
        return city.Equals("Paris", StringComparison.OrdinalIgnoreCase)
            ? "Partly cloudy, 18°C (64°F), light breeze from the west."
            : $"No weather data available for {city}.";
    },
    name: "get_weather",
    description: "Returns the current weather for a city.");

var currencyTool = AIFunctionFactory.Create(
    (
        [Description("Amount to convert")] double amount,
        [Description("Source currency code, e.g. EUR")] string from,
        [Description("Target currency code, e.g. USD")] string to
    ) =>
    {
        Console.WriteLine($"  [tool] convert_currency(amount={amount}, from={from}, to={to})");

        var rates = new Dictionary<string, double> { ["EUR_USD"] = 1.08, ["USD_EUR"] = 0.93 };
        var key = $"{from}_{to}".ToUpperInvariant();
        return rates.TryGetValue(key, out var rate)
            ? $"{amount:F2} {from} = {amount * rate:F2} {to} (rate: {rate})"
            : $"No exchange rate available for {from} → {to}.";
    },
    name: "convert_currency",
    description: "Converts an amount from one currency to another.");

// --- Wire tools into the client ---------------------------------------
// WithAIFunctionTools() registers these as an in-process MCP server and,
// with disableBuiltInTools: true (the default), restricts Claude to ONLY
// these tools — no Read/Write/Edit/Bash — mirroring ToolRunner's behavior
// of only exposing the tools you pass it.

var options = new ClaudeCodeChatClientOptions()
    .WithAIFunctionTools(new[] { weatherTool, currencyTool }, serverName: "my-tools")
    .WithModel("claude-sonnet-5")
    .WithMaxTurns(10);

await using var client = new ClaudeCodeChatClient(options);

var messages = new List<ChatMessage>
{
    new(ChatRole.User,
        "What's the current weather in Paris, and how much is €100 in USD? " +
        "Please use both tools to answer.")
};

// --- Run and print ------------------------------------------------------
// The original example streamed each turn from ToolRunner directly.
// ClaudeCodeChatClient's non-streaming call already runs the full
// tool-use loop internally and hands back the final response; swap in
// client.GetStreamingResponseAsync(messages) (see the wrapper's
// StreamingExample) if you want to observe intermediate turns instead.

var response = await client.GetResponseAsync(messages);

Console.WriteLine("\n--- Final response ---");
Console.WriteLine(response.Text);
Console.WriteLine($"\nFinish Reason: {response.FinishReason}");

Console.WriteLine("\n=== Done ===");
