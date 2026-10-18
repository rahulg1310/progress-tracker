"""The agent loop: model -> tool calls -> validated execution -> model ... -> final reply."""

import logging
from dataclasses import dataclass, field

from app.agent import tools
from app.agent.tools import ToolContext
from app.llm.gemini_client import BLOCKED_REPLY, ChatTurn, LlmClient, ToolCall

logger = logging.getLogger("kairo.agent")

MAX_STEPS = 6            # model round-trips per player message
MAX_TOOL_CALLS = 10      # tool executions per player message


@dataclass
class AgentResult:
    text: str
    model: str
    tools_used: list[str] = field(default_factory=list)
    steps: int = 0


class AgentRunner:
    def __init__(self, llm: LlmClient):
        self._llm = llm

    async def run(self, *, system_prompt: str, history: list[ChatTurn], user_message: str, ctx: ToolContext) -> AgentResult:
        transcript = self._llm.new_transcript(history, user_message)
        model: str | None = None
        used: list[str] = []

        for step_number in range(1, MAX_STEPS + 1):
            step = await self._llm.step(system_prompt=system_prompt, transcript=transcript, tools=tools.SPECS, start_model=model)
            model = step.model
            if not step.calls:
                return AgentResult(text=step.text or self._fallback(step.blocked, used), model=model, tools_used=used, steps=step_number)

            results: list[tuple[ToolCall, dict]] = []
            for call in step.calls:
                if len(used) >= MAX_TOOL_CALLS:
                    result = {"ok": False, "error": "Tool limit reached for this message. Answer with what you have."}
                else:
                    used.append(call.name)
                    result = await tools.execute(call.name, call.args, ctx)
                results.append((call, result))
            # Every call gets a response, even skipped ones, or Gemini rejects the transcript.
            self._llm.add_tool_results(transcript, step, results)

        # Out of steps: ask for a final answer with tools switched off.
        step = await self._llm.step(system_prompt=system_prompt, transcript=transcript, tools=tools.SPECS, allow_tools=False, start_model=model)
        logger.info("Agent hit MAX_STEPS request_id=%s tools=%s", ctx.service.request_id, used)
        return AgentResult(text=step.text or self._fallback(step.blocked, used), model=step.model, tools_used=used, steps=MAX_STEPS + 1)

    @staticmethod
    def _fallback(blocked: bool, used: list[str]) -> str:
        if blocked and not used:
            return BLOCKED_REPLY
        return "Done. Check the details above, and let me know if you want anything else."
