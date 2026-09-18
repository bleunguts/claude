import asyncio

from claude_agent_sdk import (
    AgentDefinition,
    ClaudeAgentOptions,
    ClaudeSDKClient,
)
from demo_display import show

RELIABLE_CHECKER = AgentDefinition(
    description="Reviews one file for style issues. Works correctly.",
    prompt=(
        "You are a style reviewer for the payments API docs. "
        "Review docs/authentication.md against the project "
        "conventions. One DOCS-ISSUE line per finding, with the "
        "file name."
    ),
    tools=["Read", "Grep", "Glob"],
    model="claude-haiku-4-5-20251001",
)

SLOW_CHECKER = AgentDefinition(
    description="Produces a comprehensive cross-reference report.",
    prompt=(
        "Read every file under docs/ and examples/ and all of "
        "data/api_reference.json. Compare them exhaustively and "
        "produce a comprehensive report of every inconsistency."
    ),
    tools=["Read", "Grep", "Glob"],
    model="claude-haiku-4-5-20251001",
    maxTurns=2,  # a real task, an impossible budget: a forced timeout
)

MISSCOPED_CHECKER = AgentDefinition(
    description="Validates code examples against the API reference.",
    prompt=(
        "Review the Python examples under examples/ against "
        "data/api_reference.json. Report any field name or "
        "endpoint that does not match the reference. One "
        "DOCS-ISSUE line per finding, with the file name. If you "
        "cannot read the files you need, report the single token "
        "UNAVAILABLE and nothing else."
    ),
    tools=["Glob"],  # misconfigured: no Read or Grep, so it cannot open files
    model="claude-haiku-4-5-20251001",
)

options = ClaudeAgentOptions(
    model="claude-sonnet-4-6",
    system_prompt=(
        "You are the lead reviewer for the payments API docs. "
        "Delegate to your subagents in parallel. Dispatch each "
        "subagent exactly once. Do not retry a subagent that "
        "fails, truncates, or returns incomplete output, and do "
        "not perform any review work yourself. Build the report "
        "only from what the subagents return, and name every "
        "review dimension that was not covered, with the reason."
    ),
    setting_sources=["project"],
    agents={
        "reliable_checker": RELIABLE_CHECKER,
        "slow_checker": SLOW_CHECKER,
        "misscoped_checker": MISSCOPED_CHECKER,
    },
    disallowed_tools=["Write", "Edit", "Bash", "NotebookEdit"],
)


async def main():
    async with ClaudeSDKClient(options=options) as client:
        await client.query(
            "Run all three checkers in parallel, then write the "
            "final report: findings first, then a section that "
            "names what was not covered and why."
        )
        async for message in client.receive_response():
            show(message)


asyncio.run(main())