import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions

async def main():
    options = ClaudeAgentOptions(
        model="claude-haiku-4-5-20251001",
        setting_sources=[],
        tools=[],
    )
    prompt = "In one sentence: what is the Claude Agent SDK?"

    async for message in query(prompt=prompt, options=options):
        print(type(message).__name__, message)

asyncio.run(main())