"""Guards the "every number must come from evidence" rule in prompts.SYSTEM_PROMPT.

Heuristic, not a formal proof: it collects every numeric leaf (and a few list
lengths) from the evidence JSON as a set of acceptable string forms, then
checks that every number the model wrote appears in that set at some rounding.
"""

import re

_NUMBER_RE = re.compile(r"[-+]?\d+(?:[.,]\d+)?")
_ROUNDING_DIGITS = (0, 1, 2, 3)
_LIST_LENGTH_KEYS = {"decisions", "effects", "synergies", "criticalIndicators", "districts", "targets"}


def _add_number(acceptable: set[str], value: float) -> None:
    for digits in _ROUNDING_DIGITS:
        formatted = f"{value:.{digits}f}"
        acceptable.add(formatted)
        acceptable.add(formatted.lstrip("+"))
        if value > 0:
            acceptable.add(f"+{formatted}")
    acceptable.add(str(value))


def _collect_evidence_numbers(node: object, acceptable: set[str]) -> None:
    if isinstance(node, bool):
        return
    if isinstance(node, (int, float)):
        _add_number(acceptable, float(node))
        return
    if isinstance(node, dict):
        for key, value in node.items():
            if isinstance(value, list) and key in _LIST_LENGTH_KEYS:
                _add_number(acceptable, float(len(value)))
            _collect_evidence_numbers(value, acceptable)
        return
    if isinstance(node, list):
        for item in node:
            _collect_evidence_numbers(item, acceptable)


def _extract_response_numbers(draft: dict) -> list[float]:
    text = " ".join([
        draft.get("summary", ""),
        *draft.get("strengths", []),
        *draft.get("risks", []),
        *draft.get("tradeoffs", []),
        *draft.get("recommendations", []),
    ])
    numbers = []
    for match in _NUMBER_RE.finditer(text):
        token = match.group().replace(",", ".")
        try:
            numbers.append(float(token))
        except ValueError:
            continue
    return numbers


def find_unsupported_numbers(draft: dict, evidence: dict) -> list[float]:
    """Return response numbers that cannot be matched to any evidence value."""
    acceptable: set[str] = set()
    _collect_evidence_numbers(evidence, acceptable)

    unsupported = []
    for value in _extract_response_numbers(draft):
        candidates = {f"{value:.{digits}f}" for digits in _ROUNDING_DIGITS}
        if not candidates & acceptable:
            unsupported.append(value)
    return unsupported
