export interface ResultadoPaginado<T> {
    itens: T[];
    pagina: number;
    tamanhoPagina: number;
    totalItens: number;
    totalPaginas: number;
}

export interface ErroApi {
    message: string;
    code: string;
    traceId: string;
}