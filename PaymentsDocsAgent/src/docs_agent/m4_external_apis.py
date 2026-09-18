import os

import asyncio

import httpx
from claude_agent_sdk import (
    ClaudeAgentOptions,
    ClaudeSDKClient,
    create_sdk_mcp_server,
    tool,
)

from demo_display import show  # streaming helper, unchanged

BASE_URL = os.environ.get("DOCS_SERVICE_URL", "http://localhost:8765")
TOKEN = os.environ.get("DOCS_SERVICE_TOKEN", "demo-token")


@tool(
    "get_release_notes",
    "Fetch a summary of what changed in a payments API release.",
    {"version": str},
)
async def get_release_notes(args):
    headers = {"Authorization": f"Bearer {TOKEN}"}
    async with httpx.AsyncClient(base_url=BASE_URL) as http:
        response = await http.get(
            f"/release-notes/{args['version']}", headers=headers
        )
        if response.status_code == 429:
            delay = float(response.headers["Retry-After"])
            print(f"[get_release_notes] 429; retrying in {delay}s")
            await asyncio.sleep(delay)
            response = await http.get(
                f"/release-notes/{args['version']}", headers=headers
            )
        response.raise_for_status()
        payload = response.json()
        summary = "\n".join(
            f"- {c['area']}: {c['change']}" for c in payload["changes"]
        )
        return {
            "content": [{
                "type": "text",
                "text": f"Release {args['version']}:\n{summary}",
            }]
        }


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
    tools=[get_release_notes, record_docs_issue],
)

options = ClaudeAgentOptions(
    model="claude-sonnet-4-6",
    system_prompt=(
        "You maintain the payments API docs. Check the docs against "
        "the latest release notes, and record one tracker issue for "
        "the first discrepancy you find, then stop."
    ),
    setting_sources=["project"],
    mcp_servers={"external-service": external_service},
    allowed_tools=[
        "Read",
        "Grep",
        "Glob",
        "mcp__external-service__get_release_notes",
        "mcp__external-service__record_docs_issue",
    ],
    disallowed_tools=["Write", "Edit", "Bash", "NotebookEdit"],
)


async def main():
    async with ClaudeSDKClient(options=options) as client:
        await client.query(
            "Fetch the release notes for the current version, check "
            "docs/charges.md against them, and record an issue for "
            "anything out of date."
        )
        async for message in client.receive_response():
            show(message)


asyncio.run(main())