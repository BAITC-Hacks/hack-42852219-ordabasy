"""Minimal OpenAI Chat Completions client (stdlib only, no SDK dependency)."""

import json
import urllib.error
import urllib.request

from app.modules.analysis.schemas import RESPONSE_JSON_SCHEMA

CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions"


class OpenAICallError(Exception):
    """Raised when the OpenAI request fails or returns an unusable payload."""


def call_openai_chat(
    *,
    system_prompt: str,
    user_content: str,
    model: str,
    api_key: str,
    timeout: float,
) -> dict:
    """Send one structured-output chat completion request and return the parsed JSON object."""
    body = json.dumps({
        "model": model,
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ],
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "analysis_response",
                "strict": True,
                "schema": RESPONSE_JSON_SCHEMA,
            },
        },
    }).encode("utf-8")

    request = urllib.request.Request(
        CHAT_COMPLETIONS_URL,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            payload = json.loads(response.read())
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise OpenAICallError(f"OpenAI request failed with {exc.code}: {detail}") from exc
    except (urllib.error.URLError, TimeoutError) as exc:
        raise OpenAICallError(f"OpenAI request failed: {exc}") from exc

    try:
        content = payload["choices"][0]["message"]["content"]
        return json.loads(content)
    except (KeyError, IndexError, json.JSONDecodeError) as exc:
        raise OpenAICallError(f"OpenAI returned an unexpected payload: {exc}") from exc
