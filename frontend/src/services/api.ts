const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ErroApi {
    message: string;
    code: string;
    traceId: string;
}

export class ApiError extends Error {
    status: number;
    code: string;
    traceId: string;

    constructor(
        status: number,
        message: string,
        code: string,
        traceId: string
    ) {
        super(message);

        this.status = status;
        this.code = code;
        this.traceId = traceId;
    }
}

export async function apiFetch<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    if (!API_URL) {
        throw new Error(
            "NEXT_PUBLIC_API_URL não foi configurada."
        );
    }

    const headers = new Headers(options?.headers);

    if (options?.body) {
        headers.set(
            "Content-Type",
            "application/json"
        );
    }

    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,
            headers
        }
    );

    if (!response.ok) {
        const erro: ErroApi = await response
            .json()
            .catch(() => ({
                message: "Erro ao comunicar com a API.",
                code: "UNKNOWN_ERROR",
                traceId: ""
            }));

        throw new ApiError(
            response.status,
            erro.message,
            erro.code,
            erro.traceId
        );
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json();
}