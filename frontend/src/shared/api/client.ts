import { API_BASE_URL } from "@/shared/config";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function postJson<TResponse>(
  path: string,
  payload: unknown,
): Promise<TResponse> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ApiError(
        response.status === 422
          ? "Сервер отклонил сценарий. Проверьте выбранные решения."
          : "Не удалось запустить симуляцию. Проверьте соединение с сервером.",
        response.status,
      );
    }

    return (await response.json()) as TResponse;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("Сервер не ответил вовремя. Попробуйте ещё раз.");
    }
    throw new ApiError(
      "Не удалось запустить симуляцию. Проверьте соединение с сервером.",
    );
  } finally {
    window.clearTimeout(timeout);
  }
}
