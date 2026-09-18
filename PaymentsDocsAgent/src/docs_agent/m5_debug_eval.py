import asyncio
import dataclasses
import json
from pathlib import Path

from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    ClaudeSDKClient,
    ResultMessage,
    TextBlock,
    ToolResultBlock,
    ToolUseBlock,
    UserMessage,
)

REPO_ROOT = Path(__file__).resolve().parents[2]

options = ClaudeAgentOptions(
    model="claude-haiku-4-5-20251001",
    system_prompt="You are a precise docs reviewer.",
    cwd=str(REPO_ROOT),
    setting_sources=["project"],
    allowed_tools=["Read", "Glob", "Grep"],
    disallowed_tools=["Write", "Edit", "Bash", "NotebookEdit"],
)

EVAL_CASES = [
    {
        "name": "authentication-wrong-scheme",
        "prompt": "Review docs/authentication.md against the data files and "
                  "summarize what, if anything, is wrong.",
        "expected_facts": ["X-API-Key", "Bearer"],
        "expected_read": "docs/authentication.md",
    },
    {
        "name": "charges-deprecated-version",
        "prompt": "Review docs/charges.md against the data files and "
                  "summarize what, if anything, is wrong.",
        "expected_facts": ["v1", "v2"],
        "expected_read": "docs/charges.md",
    },
    {
        "name": "webhooks-missing-event",
        "prompt": "Review docs/webhooks.md against the data files and "
                  "summarize what, if anything, is wrong.",
        "expected_facts": ["payment.refunded"],
        "expected_read": "docs/webhooks.md",
    },
    {
        "name": "example-deprecated-field",
        "prompt": "Review examples/create_charge.py against the data files "
                  "and summarize what, if anything, is wrong.",
        "expected_facts": ["amount_cents"],
        "expected_read": "examples/create_charge.py",
    },
]


def trace_recorder(path):
    trace_path = Path(path)
    records = []

    def record(message):
        entry = {"type": type(message).__name__}
        entry.update(dataclasses.asdict(message))
        records.append(entry)

    def save():
        trace_path.parent.mkdir(parents=True, exist_ok=True)
        trace_path.write_text(
            json.dumps(records, indent=2, default=str),
            encoding="utf-8",
        )

    return record, save


def repo_path(raw):
    """Normalize a tool's file_path so it can be matched against a repo path."""
    return "/" + str(raw).replace("\\", "/").casefold().lstrip("/")


async def run_case(case):
    record, save = trace_recorder(f"traces/{case['name']}.json")
    texts, requested, files_read = [], {}, set()
    cost, duration = 0.0, 0
    try:
        async with ClaudeSDKClient(options=options) as client:
            await client.query(case["prompt"])
            async for message in client.receive_response():
                record(message)
                if isinstance(message, AssistantMessage):
                    for block in message.content:
                        if isinstance(block, TextBlock):
                            texts.append(block.text)
                        elif isinstance(block, ToolUseBlock) and block.name == "Read":
                            requested[block.id] = repo_path(
                                block.input.get("file_path", "")
                            )
                elif isinstance(message, UserMessage) and isinstance(
                    message.content, list
                ):
                    for block in message.content:
                        if isinstance(block, ToolResultBlock) and not block.is_error:
                            path = requested.get(block.tool_use_id)
                            if path:
                                files_read.add(path)
                elif isinstance(message, ResultMessage):
                    cost = message.total_cost_usd or 0.0
                    duration = message.duration_ms or 0
    finally:
        save()

    findings = "\n".join(texts).casefold()
    task_ok = all(fact.casefold() in findings for fact in case["expected_facts"])
    tools_ok = any(
        path.endswith(case["expected_read"]) for path in files_read
    ) and any("/data/" in path for path in files_read)

    print(f"{case['name']}: task {'PASS' if task_ok else 'FAIL'} "
          f"| tools {'PASS' if tools_ok else 'FAIL'} "
          f"| ${cost:.4f} | {duration} ms")
    return task_ok, tools_ok, cost, duration


async def main():
    results = []
    for case in EVAL_CASES:
        try:
            results.append(await run_case(case))
        except Exception as error:
            print(f"{case['name']}: ERROR | {error}")
            results.append((False, False, 0.0, 0))

    tasks_passed = sum(1 for result in results if result[0])
    tools_passed = sum(1 for result in results if result[1])
    total_cost = sum(result[2] for result in results)
    durations = [result[3] for result in results if result[3] > 0]
    average_ms = sum(durations) // len(durations) if durations else 0
    print(f"summary: task {tasks_passed}/{len(results)} "
          f"| tools {tools_passed}/{len(results)} "
          f"| total ${total_cost:.4f} | average {average_ms} ms")


if __name__ == "__main__":
    asyncio.run(main())