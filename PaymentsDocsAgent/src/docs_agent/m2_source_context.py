import asyncio
from claude_agent_sdk import ResultMessage, query, ClaudeAgentOptions

async def main():
    async for message in query(
        prompt=(
            "Based only on the conventions defined for this project, "
            "what is the exact project marker and preferred issue label? "
            "If you do not have access to those project conventions, say so plainly. "
            "Answer in two short sentences."
        ),
        options=ClaudeAgentOptions(
            model="claude-haiku-4-5-20251001",
            tools=[],
            # setting_sources=[]      
            setting_sources=["project"]
        ),
    ):
        if isinstance(message, ResultMessage):
          print(message.result)

if __name__ == "__main__":
    asyncio.run(main())
