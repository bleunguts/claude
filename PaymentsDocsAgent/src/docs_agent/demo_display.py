"""Filtered console view of a Claude Agent SDK run.

Keeps the demo scripts focused on the agents: import `show` and pass each
streamed message to it. Subagent work prints indented, each dispatch summary
and the orchestrator's own text print, and file paths shorten to file names.
The same helper handles one delegation or several running at once.
"""

from claude_agent_sdk import (
    AssistantMessage,
    ResultMessage,
    SystemMessage,
    TextBlock,
    ToolResultBlock,
    ToolUseBlock,
    UserMessage,
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
    """Print one streamed message in the filtered demo view."""
    indent = "    " if getattr(message, "parent_tool_use_id", None) else ""
    if isinstance(message, SystemMessage) and message.subtype == "init":
        print("init | tools:", message.data.get("tools"))
    elif isinstance(message, AssistantMessage):
        for block in message.content:
            if isinstance(block, ToolUseBlock):
                if block.name == "Agent":  # the dispatch tool (not in the init list)
                    DISPATCH_IDS.add(block.id)
                print(f"{indent}tool | {block.name} {_fmt_input(block.name, block.input)}")
            elif isinstance(block, TextBlock):
                print(f"{indent}claude | {block.text}")
    elif isinstance(message, UserMessage) and isinstance(message.content, list):
        for block in message.content:
            if isinstance(block, ToolResultBlock) and block.tool_use_id in DISPATCH_IDS:
                print(f"summary | {_summary_text(block.content)}")
    elif isinstance(message, ResultMessage):
        print(f"done | cost ${message.total_cost_usd:.4f} | {message.duration_ms} ms")