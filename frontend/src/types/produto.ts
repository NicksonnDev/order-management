export enum StatusProduto {
    Ativo = 1,
    Inativo = 2
}

export interface Produto {
    id: number;
    nome: string;
    descricao: string;
    preco: number;
    quantidadeEstoque: number;
    status: StatusProduto;
    dataCriacao: string;
}

export interface ListarProdutosParams {
    pagina?: number;
    tamanhoPagina?: number;
    nome?: string;
    status?: StatusProduto;
    ordenarPor?: string;
    direcao?: "asc" | "desc";
}

export interface CriarProdutoRequest {
    nome: string;
    descricao: string;
    preco: number;
    quantidadeEstoque: number;
}

export interface AtualizarProdutoRequest {
    nome: string;
    descricao: string;
    preco: number;
    status: StatusProduto;
}