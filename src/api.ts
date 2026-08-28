const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;

export class ApiError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "ApiError";
        this.status = status;
    }
}

interface FetchJsonOptions<T> extends RequestInit {
    timeoutMs?: number;
    validate?: (value: unknown) => value is T;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
    return typeof value === "string";
}

export function isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
}

function getApiErrorMessage(payload: unknown): string | null {
    if (typeof payload !== "object" || payload === null) {
        return null;
    }

    const candidate = payload as Record<string, unknown>;
    if (typeof candidate.message === "string") {
        return candidate.message;
    }

    if (typeof candidate.error === "string") {
        return candidate.error;
    }

    return null;
}

export async function fetchJson<T>(input: RequestInfo | URL, options: FetchJsonOptions<T> = {}): Promise<T> {
    const {timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS, signal: callerSignal, validate, ...requestInit} = options;
    const requestController = new AbortController();
    let didTimeout = false;
    const timeoutId = setTimeout(() => {
        didTimeout = true;
        requestController.abort();
    }, timeoutMs);
    const abortRequest = () => requestController.abort();

    if (callerSignal?.aborted) {
        requestController.abort();
    } else {
        callerSignal?.addEventListener("abort", abortRequest, {once: true});
    }

    try {
        const response = await fetch(input, {...requestInit, signal: requestController.signal});
        let payload: unknown;

        try {
            payload = await response.json();
        } catch {
            throw new ApiError(
                response.ok
                    ? "The API returned an invalid response."
                    : `The API request failed with status ${response.status}.`,
                response.status,
            );
        }

        if (!response.ok) {
            throw new ApiError(
                getApiErrorMessage(payload) ?? `The API request failed with status ${response.status}.`,
                response.status,
            );
        }

        if (validate !== undefined && !validate(payload)) {
            throw new ApiError("The API returned data in an unexpected format.", response.status);
        }

        return payload as T;
    } catch (error) {
        if (didTimeout && !callerSignal?.aborted) {
            throw new ApiError("The API request timed out. Please try again.", 408);
        }

        throw error;
    } finally {
        clearTimeout(timeoutId);
        callerSignal?.removeEventListener("abort", abortRequest);
    }
}
