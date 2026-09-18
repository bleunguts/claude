import os
import pytest
from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ClaudeSDKClient,
    TextBlock,
    ToolUseBlock,
)

def _final_text(messages):
    return "".join(
        block.text
        for msg in messages if isinstance(msg, AssistantMessage)
        for block in msg.content if isinstance(block, TextBlock)
    )


@pytest.mark.skipif(
    not os.environ.get("ANTHROPIC_API_KEY"),
    reason="requires ANTHROPIC_API_KEY",
)
@pytest.mark.asyncio
async def test_live_haiku_finds_v1_in_charges():
    """End-to-end: a small-model reviewer must read the docs and surface
    the seeded /v1/ issue in docs/charges.md. Costs about one cent per run."""
    # Arrange
    options = ClaudeAgentOptions(
        model="claude-haiku-4-5-20251001",
        system_prompt="You are a precise docs reviewer.",
        setting_sources=["project"],
        disallowed_tools=["Write", "Edit", "MultiEdit", "Bash", "NotebookEdit"],
    )

    captured = []

    # Act
    async with ClaudeSDKClient(options=options) as client:
        await client.query(
            "Review docs/charges.md against data/api_reference.json. "
            "Summarize any inaccuracies you find."
        )
        async for msg in client.receive_response():
            captured.append(msg)

    # Assert
    tool_calls = [
        block.name
        for msg in captured if isinstance(msg, AssistantMessage)
        for block in msg.content if isinstance(block, ToolUseBlock)
    ]
    assert "Read" in tool_calls, f"expected a Read call, got: {tool_calls!r}"

    final = _final_text(captured)
    assert "v1" in final, f"expected 'v1' in agent's output, got: {final[:300]!r}"