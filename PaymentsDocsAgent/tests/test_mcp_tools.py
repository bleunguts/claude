from unittest.mock import AsyncMock, MagicMock, patch
import pytest
from src.docs_agent.m4_governance import record_docs_issue

ISSUE_ARGS = {
    "file": "docs/charges.md",
    "line": 12,
    "description": "POST /v1/charges should be POST /v2/charges",
    "severity": "high",
}


@pytest.mark.asyncio
async def test_record_docs_issue_posts_and_formats_reply():
    # Arrange
    reply = MagicMock()
    reply.json.return_value = {"id": "DOC-101"}
    http = AsyncMock()
    http.__aenter__.return_value = http
    http.post.return_value = reply

    # Act
    with patch(
        "src.docs_agent.m4_governance.httpx.AsyncClient",
        return_value=http,
    ):
        result = await record_docs_issue.handler(ISSUE_ARGS)

    # Assert
    http.post.assert_called_once()
    assert http.post.call_args.kwargs["json"] == ISSUE_ARGS
    assert "DOC-101" in result["content"][0]["text"]