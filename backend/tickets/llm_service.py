import json
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

CLASSIFY_PROMPT = """You are a support ticket classification assistant. Given a support ticket description, you must classify it into exactly one category and one priority level.

Categories:
- billing: payment issues, invoices, charges, refunds, subscriptions
- technical: bugs, errors, crashes, performance issues, integrations not working
- account: login issues, password resets, account access, profile settings, permissions
- general: anything that doesn't fit the above categories

Priority levels:
- low: minor inconvenience, cosmetic issue, feature request, non-urgent question
- medium: moderate issue affecting productivity but has a workaround
- high: significant problem with no workaround, affecting core functionality
- critical: service completely down, data loss risk, security vulnerability, blocking all work

You MUST respond with ONLY a JSON object in this exact format (no markdown, no explanation):
{"category": "<one of: billing, technical, account, general>", "priority": "<one of: low, medium, high, critical>"}
"""


def classify_ticket(description: str) -> dict:
    """
    Call Groq API to classify a ticket description.
    Returns dict with 'suggested_category' and 'suggested_priority'.
    Returns None if the call fails for any reason (graceful degradation).
    """
    api_key = settings.GROQ_API_KEY
    if not api_key:
        logger.warning("GROQ_API_KEY not configured — skipping classification")
        return None

    payload = {
        "model": settings.GROQ_MODEL,
        "messages": [
            {"role": "system", "content": CLASSIFY_PROMPT},
            {"role": "user", "content": f"Ticket description:\n{description}"},
        ],
        "temperature": 0.1,
        "max_tokens": 60,
    }

    try:
        response = requests.post(
            settings.GROQ_API_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=10,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"].strip()

        # Strip markdown fences if model adds them anyway
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]

        result = json.loads(content)
        category = result.get("category", "").lower()
        priority = result.get("priority", "").lower()

        valid_categories = {"billing", "technical", "account", "general"}
        valid_priorities = {"low", "medium", "high", "critical"}

        if category not in valid_categories or priority not in valid_priorities:
            logger.warning("LLM returned invalid values: %s", result)
            return None

        return {"suggested_category": category, "suggested_priority": priority}

    except requests.exceptions.Timeout:
        logger.warning("Groq API timeout")
    except requests.exceptions.RequestException as e:
        logger.warning("Groq API request failed: %s", e)
    except (json.JSONDecodeError, KeyError, IndexError) as e:
        logger.warning("Failed to parse Groq response: %s", e)

    return None
