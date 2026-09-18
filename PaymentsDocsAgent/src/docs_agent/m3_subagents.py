import asyncio
from claude_agent_sdk import (
    AgentDefinition,
    AssistantMessage,
    ClaudeAgentOptions,
    ClaudeSDKClient,
    ResultMessage,
    SystemMessage,
    TextBlock,
    ToolResultBlock,
    ToolUseBlock,
    UserMessage,
)

STYLE_CHECKER = AgentDefinition(
    description=(
        "Reviews documentation for style-guide compliance: "
        "tone, terminology, and structure."
    ),
    prompt=(
        "You are a style reviewer for the payments API docs. "
        "Read only data/style_guide.json and the single document "
        "you are asked to review. Do not open, search for, or read "
        "any other file. Report only tone, terminology, and required "
        "structure. Do not mention API versions, endpoints, fields, "
        "or accuracy, even as an aside, even if you notice a problem; "
        "another reviewer owns that. Report each finding on its own "
        "line with the DOCS-ISSUE label and the file name."
    ),
    tools=["Read"],  # no Grep/Glob: cannot discover or open other files
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
    tools=["Read", "Grep", "Glob"],
    model="claude-haiku-4-5-20251001",
)

options = ClaudeAgentOptions(
    model="claude-sonnet-4-6",
    system_prompt=(
        "You are the lead reviewer for the payments API docs. "
        "Delegate review work to your subagents and relay their "
        "findings without rewriting them."
    ),
    setting_sources=["project"],
    agents={
        "style_checker": STYLE_CHECKER,
        "api_accuracy_checker": API_ACCURACY_CHECKER,
    },
    disallowed_tools=["Write", "Edit", "Bash", "NotebookEdit"],
)

DISPATCH_IDS = set()


def _base(path):
    """Last path segment, tolerant of either separator."""
    return path.replace("\\", "/").rsplit("/", 1)[-1]


def _fmt_input(name, data):
    """One readable line for a tool call's input."""
    if not isinstance(data, dict):
        return str(data)[:60]
    if name == "Agent":  # the dispatch tool: which subagent, and the task
        return f"-> {data.get('subagent_type', '?')}: {data.get('description', '')}"
    if "file_path" in data:
        return _base(data["file_path"])
    if "pattern" in data:
        return data["pattern"]
    return ", ".join(data.keys())


def _summary_text(content, limit=140):
    """Pull text from a tool result and shorten on a word boundary."""
    if isinstance(content, list):
        text = " ".join(b.get("text", "") for b in content if isinstance(b, dict))
    else:
        text = str(content)
    text = " ".join(text.split())  # collapse newlines and runs of spaces
    if len(text) > limit:
        return text[:limit].rsplit(" ", 1)[0] + " ..."
    return text


def show(message):
    """Filtered view: subagent work indents; the dispatch summary and
    the orchestrator's relay print; paths shorten to file names."""
    indent = "    " if getattr(message, "parent_tool_use_id", None) else ""
    if isinstance(message, SystemMessage) and message.subtype == "init":
        print("init | tools:", message.data.get("tools"))
    elif isinstance(message, AssistantMessage):
        for block in message.content:
            if isinstance(block, ToolUseBlock):
                if block.name == "Agent":  # confirmed dispatch tool (not in init list)
                    DISPATCH_IDS.add(block.id)
                print(f"{indent}tool | {block.name} {_fmt_input(block.name, block.input)}")
            elif isinstance(block, TextBlock):
                print(f"{indent}claude | {block.text}")
    elif isinstance(message, UserMessage) and isinstance(message.content, list):
        for block in message.content:
            if (
                isinstance(block, ToolResultBlock)
                and block.tool_use_id in DISPATCH_IDS
            ):
                print(f"summary | {_summary_text(block.content)}")
    elif isinstance(message, ResultMessage):
        print(f"done | cost ${message.total_cost_usd:.4f} | {message.duration_ms} ms")


async def main():
    async with ClaudeSDKClient(options=options) as client:
        await client.query(
            "Have the style checker review docs/charges.md "
            "and report its findings."
        )
        async for message in client.receive_response():
            show(message)


asyncio.run(main())