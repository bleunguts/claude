import asyncio
from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ResultMessage,
    SystemMessage,
    TextBlock,
    ToolUseBlock,
    query,
)

REVIEWER_PROMPT = (
    "You are a documentation reviewer for the payments API. "
    "Read the docs and examples, then report anything inaccurate, "
    "outdated, or inconsistent with the project conventions."
)

options = ClaudeAgentOptions(
    model="claude-haiku-4-5-20251001",
    system_prompt=REVIEWER_PROMPT,
    setting_sources=["project"],
    disallowed_tools=["Write", "Edit", "Bash", "NotebookEdit"],
)


def show(message):
    """Print the run at a readable level of detail.

    Tool results, thinking blocks, and internal system messages
    are intentionally not printed; raw file contents would flood
    the terminal. Add result logging back when debugging.
    """
    if isinstance(message, SystemMessage) and message.subtype == "init":
        print("init | tools:", message.data.get("tools"))
    elif isinstance(message, AssistantMessage):
        for block in message.content:
            if isinstance(block, ToolUseBlock):
                print(f"tool | {block.name} {str(block.input)[:60]}")
            elif isinstance(block, TextBlock):
                print("claude |", block.text)
    elif isinstance(message, ResultMessage):
        print(f"done | cost ${message.total_cost_usd} | {message.duration_ms} ms")


async def main():
    async for message in query(
        prompt="Review the docs and examples and summarize what needs attention.",
        options=options,
    ):
        show(message)


asyncio.run(main())