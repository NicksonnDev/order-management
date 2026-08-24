export interface ResultadoPaginado<T> {
    itens: T[];
    pagina: number;
    tamanhoPagina: number;
    totalItens: number;
    totalPaginas: number;
}