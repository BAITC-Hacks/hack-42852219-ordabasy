import json
from typing import Callable

from fastapi import status

from app.core.exceptions import AppError
from app.modules.analysis.client import OpenAICallError, call_openai_chat
from app.modules.analysis.numeric_check import find_unsupported_numbers
from app.modules.analysis.prompts import SYSTEM_PROMPT
from app.modules.analysis.schemas import AnalysisDraft
from app.modules.simulations.schemas import AnalysisResponse

OpenAICaller = Callable[..., dict]


class AnalysisUnavailableError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(
            message, code="analysis_unavailable", status_code=status.HTTP_502_BAD_GATEWAY
        )


class AnalysisService:
    """Turns trusted evidence into an AI-written explanation via OpenAI.

    Never recomputes the Score or evidence; only explains it. Enforces that
    every number the model states is traceable to the evidence it was given,
    retrying once with a corrective note before giving up.
    """

    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        timeout: float,
        call_openai: OpenAICaller = call_openai_chat,
    ) -> None:
        self._api_key = api_key
        self._model = model
        self._timeout = timeout
        self._call_openai = call_openai

    def analyze(self, evidence: dict) -> AnalysisResponse:
        user_content = self._user_content(evidence)
        draft, unsupported = self._generate(user_content, evidence)

        if unsupported:
            correction = (
                f"{user_content}\n\nВ предыдущем ответе были числа, отсутствующие в evidence: "
                f"{', '.join(f'{value:g}' for value in unsupported)}. "
                "Перепиши ответ: используй только числа из evidence или опиши эффект без цифры."
            )
            draft, unsupported = self._generate(correction, evidence)
            if unsupported:
                raise AnalysisUnavailableError(
                    "AI-анализ отклонён: числа в ответе не совпадают с расчётом."
                )

        return AnalysisResponse(scenarioVersion=evidence["scenarioVersion"], **draft.model_dump())

    def _generate(self, user_content: str, evidence: dict) -> tuple[AnalysisDraft, list[float]]:
        try:
            raw = self._call_openai(
                system_prompt=SYSTEM_PROMPT,
                user_content=user_content,
                model=self._model,
                api_key=self._api_key,
                timeout=self._timeout,
            )
        except OpenAICallError as exc:
            raise AnalysisUnavailableError(f"AI-анализ недоступен: {exc}") from exc

        try:
            draft = AnalysisDraft.model_validate(raw)
        except Exception as exc:  # noqa: BLE001 - any bad payload maps to the same outcome
            raise AnalysisUnavailableError(f"AI вернул неверный формат ответа: {exc}") from exc

        unsupported = find_unsupported_numbers(raw, evidence)
        return draft, unsupported

    @staticmethod
    def _user_content(evidence: dict) -> str:
        return (
            "evidence (единственный источник истины, ничего не выдумывай сверх этого JSON):\n"
            f"{json.dumps(evidence, ensure_ascii=False)}"
        )
