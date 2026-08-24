import { apiFetch } from "@/services/api";
import { ResultadoPaginado } from "@/types/paginacao";
import {
    AtualizarProdutoRequest,
    CriarProdutoRequest,
    ListarProdutosParams,
    Produto
} from "@/types/produto";

export async function listarProdutos(
    filtros: ListarProdutosParams = {}
): Promise<ResultadoPaginado<Produto>> {
    const params = new URLSearchParams();

    if (filtros.pagina) {
        params.set(
            "pagina",
            filtros.pagina.toString()
        );
    }

    if (filtros.tamanhoPagina) {
        params.set(
            "tamanhoPagina",
            filtros.tamanhoPagina.toString()
        );
    }

    if (filtros.nome) {
        params.set(
            "nome",
            filtros.nome
        );
    }

    if (filtros.status) {
        params.set(
            "status",
            filtros.status.toString()
        );
    }

    if (filtros.ordenarPor) {
        params.set(
            "ordenarPor",
            filtros.ordenarPor
        );
    }

    if (filtros.direcao) {
        params.set(
            "direcao",
            filtros.direcao
        );
    }

    const query = params.toString();

    return apiFetch<ResultadoPaginado<Produto>>(
        `/Produtos${query ? `?${query}` : ""}`
    );
}

export async function obterProdutoPorId(
    id: number
): Promise<Produto> {
    return apiFetch<Produto>(
        `/Produtos/${id}`
    );
}

export async function criarProduto(
    request: CriarProdutoRequest
): Promise<Produto> {
    return apiFetch<Produto>(
        "/Produtos",
        {
            method: "POST",
            body: JSON.stringify(request)
        }
    );
}

export async function atualizarProduto(
    id: number,
    request: AtualizarProdutoRequest
): Promise<Produto> {
    return apiFetch<Produto>(
        `/Produtos/${id}`,
        {
            method: "PUT",
            body: JSON.stringify(request)
        }
    );
}