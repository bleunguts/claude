import os
import asyncio
from pathlib import Path

import httpx
from claude_agent_sdk import (
    ClaudeAgentOptions,
    ClaudeSDKClient,
    HookMatcher,
    PermissionResultAllow,
    PermissionResultDeny,
    create_sdk_mcp_server,
    tool,
)

# from demo_display import show

BASE_URL = os.environ.get("DOCS_SERVICE_URL", "http://localhost:8765")
TOKEN = os.environ.get("DOCS_SERVICE_TOKEN", "demo-token")

@tool(
    "record_docs_issue",
    "Record a documentation issue in the team tracker.",
    {"file": str, "line": int, "description": str, "severity": str},
)
async def record_docs_issue(args):
    headers = {"Authorization": f"Bearer {TOKEN}"}
    async with httpx.AsyncClient(base_url=BASE_URL) as http:
        response = await http.post("/issues", headers=headers, json=args)
        response.raise_for_status()
        issue = response.json()
        return {
            "content": [{
                "type": "text",
                "text": f"Recorded issue {issue['id']} for {args['file']}.",
            }]
        }

external_service = create_sdk_mcp_server(
    name="external-service",
    tools=[record_docs_issue],
)

WRITE_TOOLS = {"Edit", "mcp__external-service__record_docs_issue"}

async def approve_tool(tool_name, tool_input, context):
    if tool_name not in WRITE_TOOLS:
        return PermissionResultAllow()
    if os.environ.get("AUTO_APPROVE_WRITES") == "y":
        return PermissionResultAllow()
    try:
        answer = input(f"Approve {tool_name} with {tool_input}? [y/N] ")
    except EOFError:
        return PermissionResultDeny(
            message="No interactive approval available; write denied."
        )
    if answer.strip().lower() == "y":
        return PermissionResultAllow()
    return PermissionResultDeny(message=f"{tool_name} denied by reviewer.")

REPO_ROOT = Path(__file__).resolve().parents[2]
ALLOWED_EDIT_ROOTS = tuple(
    (REPO_ROOT / name).resolve() for name in ("docs", "examples")
)

async def guard_edit_path(input_data, tool_use_id, context):
    target = Path(str(input_data["tool_input"].get("file_path", ""))).resolve()
    if any(target.is_relative_to(root) for root in ALLOWED_EDIT_ROOTS):
        print(f"[guard_edit_path] allowed {target}")
        return {}
    print(f"[guard_edit_path] denied {target}")
    return {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": (
                f"Edits are restricted to docs/ and examples/; got {target}."
            ),
        }
    }

ALLOWED_SEVERITIES = {"low", "medium", "high"}

async def validate_issue_payload(input_data, tool_use_id, context):
    severity = input_data["tool_input"].get("severity")
    if severity in ALLOWED_SEVERITIES:
        print(f"[validate_issue_payload] allowed severity={severity}")
        return {}
    print(f"[validate_issue_payload] denied severity={severity!r}")
    return {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "deny",
            "permissionDecisionReason": (
                f"severity must be one of {sorted(ALLOWED_SEVERITIES)}; "
                f"got {severity!r}."
            ),
        }
    }

options = ClaudeAgentOptions(
    model="claude-sonnet-4-6",
    system_prompt=(
        "You maintain the payments API docs. Verify the docs, record "
        "tracker issues with a severity of low, medium, or high, and "
        "apply edits that fix them."
    ),
    setting_sources=["project"],
    mcp_servers={
        "external-service": external_service,
    },
    allowed_tools=[
        "Read",
        "Glob",
        "Grep",
    ],
    disallowed_tools=["Write", "Bash", "NotebookEdit"],  # Edit omitted: governed, not blocked
    can_use_tool=approve_tool,
    hooks={
        "PreToolUse": [
            HookMatcher(matcher="Edit", hooks=[guard_edit_path]),
            HookMatcher(
                matcher="mcp__external-service__record_docs_issue",
                hooks=[validate_issue_payload],
            ),
        ],
    },
)


async def main():
    from demo_display import show

    async with ClaudeSDKClient(options=options) as client:
        await client.query(
            "Read docs/charges.md. Record one high-severity tracker "
            "issue for line 12, noting that POST /v1/charges should be "
            "POST /v2/charges. Then edit that line to use POST /v2/charges."
        )
        async for message in client.receive_response():
            show(message)


if __name__ == "__main__":
    asyncio.run(main())