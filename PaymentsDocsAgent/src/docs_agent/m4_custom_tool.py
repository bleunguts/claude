import asyncio
from claude_agent_sdk import (
    ClaudeAgentOptions,
    ClaudeSDKClient,
    create_sdk_mcp_server,
    tool,
)
from demo_display import show  # streaming helper, unchanged

# Recent production usage, a fact the repo does not contain.
API_USAGE = {
    "POST /v1/charges": "0 calls in the last 90 days. Replaced by POST /v2/charges.",
    "POST /v2/charges": "4,820,231 calls in the last 90 days.",
    "GET /v1/charges/{id}": "0 calls in the last 90 days. No live integrations.",
    "customer_id": "Present in 0% of live charge responses.",
}

@tool(
    "lookup_api_usage",
    "Return recent production usage for one API endpoint or response field.",
    {"name": str},)
async def lookup_api_usage(args):
    name = args["name"]
    result = API_USAGE.get(name)
    if result is None:
        result = f"No production usage record found for {name}."
    return {"content": [{"type": "text", "text": result}]}


api_reference_server = create_sdk_mcp_server(
    name="api-reference",
    tools=[lookup_api_usage],
)

options = ClaudeAgentOptions(
    model="claude-sonnet-4-6",
    system_prompt=(
        "Check docs/charges.md against real usage. For each endpoint and "
        "response field the doc mentions, call the usage tool. Flag "
        "anything the tool shows has no recent usage. Report each as one "
        "DOCS-ISSUE line with the file name."
    ),
    setting_sources=["project"],
    mcp_servers={"api-reference": api_reference_server},
    allowed_tools=[
        "Read",
        "Grep",
        "Glob",
        "mcp__api-reference__lookup_api_usage",
    ],
    disallowed_tools=["Write", "Edit", "Bash", "NotebookEdit"],
)


async def main():
    async with ClaudeSDKClient(options=options) as client:
        await client.query(
            "Check docs/charges.md for endpoints and fields that are no "
            "longer used in production."
        )
        async for message in client.receive_response():
            show(message)


asyncio.run(main())