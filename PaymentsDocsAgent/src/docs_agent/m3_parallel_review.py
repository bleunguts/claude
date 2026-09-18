import asyncio
from claude_agent_sdk import (
    AgentDefinition,
    ClaudeAgentOptions,
    ClaudeSDKClient,
)
from demo_display import show

STYLE_CHECKER = AgentDefinition(
    description=(
        "Reviews documentation for style-guide compliance: "
        "tone, terminology, and structure."
    ),
    prompt=(
        "You are a style reviewer for the payments API docs. "
        "Read data/style_guide.json, then review every Markdown "
        "document under docs/ against it. Report only tone, "
        "terminology, and required structure. Do not mention API "
        "versions, endpoints, fields, or accuracy, even as an "
        "aside, even if you notice a problem; another reviewer "
        "owns that. Report each finding on its own line with the "
        "DOCS-ISSUE label and the file name."
    ),
    tools=["Read", "Grep", "Glob"],  # sweeps the docs tree for style
    model="claude-haiku-4-5-20251001",
)

API_ACCURACY_CHECKER = AgentDefinition(
    description=(
        "Checks that documented endpoints and fields match "
        "the API reference data."
    ),
    prompt=(
        "You verify the payments API docs against "
        "data/api_reference.json. Report every mismatch between "
        "documentation and reference, one DOCS-ISSUE line each, "
        "with the file name."
    ),
    tools=["Read", "Grep", "Glob"],  # scans the docs tree against the reference
    model="claude-haiku-4-5-20251001",
)

EXAMPLE_CHECKER = AgentDefinition(
    description=(
        "Validates that code examples are syntactically reasonable "
        "and reference real fields."
    ),
    prompt=(
        "You review the Python samples under examples/ for the "
        "payments API docs. Check that each sample looks "
        "syntactically valid and only references fields that exist "
        "in data/api_reference.json. One DOCS-ISSUE line per "
        "finding, with the file name."
    ),
    tools=["Read", "Grep", "Glob"],  # traverses the examples tree
    model="claude-haiku-4-5-20251001",
)

LINK_CHECKER = AgentDefinition(
    description=(
        "Catches broken internal links and missing references "
        "across the docs."
    ),
    prompt=(
        "You check internal links and cross-references in the "
        "payments API docs under docs/. Report every link or "
        "reference that points at a missing file or section. One "
        "DOCS-ISSUE line per finding, with the file name."
    ),
    tools=["Read", "Grep", "Glob"],  # traverses the docs tree
    model="claude-haiku-4-5-20251001",
)

options = ClaudeAgentOptions(
    model="claude-sonnet-4-6",
    system_prompt=(
        "You are the lead reviewer for the payments API docs. "
        "Delegate review work to your subagents, then synthesize "
        "their findings yourself."
    ),
    setting_sources=["project"],
    agents={
        "style_checker": STYLE_CHECKER,
        "api_accuracy_checker": API_ACCURACY_CHECKER,
        "example_checker": EXAMPLE_CHECKER,
        "link_checker": LINK_CHECKER,
    },
    disallowed_tools=["Write", "Edit", "Bash", "NotebookEdit"],
)

async def main():
    async with ClaudeSDKClient(options=options) as client:
        await client.query(
            "Run all four checkers across docs/ and examples/ in "
            "parallel. Then produce one unified report: group "
            "findings by file, remove duplicates, and order each "
            "file's findings by severity. Do not infer which "
            "checker found an issue unless that checker explicitly "
            "reported it."
        )
        async for message in client.receive_response():
            show(message)


asyncio.run(main())