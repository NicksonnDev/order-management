import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
    ChevronLeft,
    ChevronRight,
    PackageOpen,
    Pencil,
    Plus,
    Search,
    X
} from "lucide-react";
import { ApiError } from "@/services/api";
import { listarProdutos } from "@/services/produtosService";
import {
    Produto,
    StatusProduto
} from "@/types/produto";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";

export default function ProdutosPage() {
    const [produtos, setProdutos] =
        useState<Produto[]>([]);

    const [pagina, setPagina] =
        useState(1);

    const [totalPaginas, setTotalPaginas] =
        useState(0);

    const [totalItens, setTotalItens] =
        useState(0);

    const [busca, setBusca] =
        useState("");

    const [nome, setNome] =
        useState("");

    const [status, setStatus] =
        useState<StatusProduto | undefined>();

    const [ordenarPor, setOrdenarPor] =
        useState("nome");

    const [direcao, setDirecao] =
        useState<"asc" | "desc">("asc");

    const [carregando, setCarregando] =
        useState(true);

    const [erro, setErro] =
        useState("");

    useEffect(() => {
        let cancelado = false;

        listarProdutos({
            pagina,
            tamanhoPagina: 50,
            nome: nome || undefined,
            status,
            ordenarPor,
            direcao
        })
            .then((resultado) => {
                if (cancelado) {
                    return;
                }

                setProdutos(resultado.itens);
                setTotalPaginas(resultado.totalPaginas);
                setTotalItens(resultado.totalItens);
                setErro("");
            })
            .catch((error) => {
                if (cancelado) {
                    return;
                }

                if (error instanceof ApiError) {
                    setErro(error.message);
                } else {
                    setErro(
                        "Não foi possível carregar os produtos."
                    );
                }
            })
            .finally(() => {
                if (!cancelado) {
                    setCarregando(false);
                }
            });

        return () => {
            cancelado = true;
        };
    }, [
        pagina,
        nome,
        status,
        ordenarPor,
        direcao
    ]);

    function pesquisar(
        event: FormEvent
    ) {
        event.preventDefault();

        const novoNome =
            busca.trim();

        if (
            pagina === 1 &&
            nome === novoNome
        ) {
            return;
        }

        setCarregando(true);
        setPagina(1);
        setNome(novoNome);
    }

    function limparBusca() {
        if (
            busca === "" &&
            nome === "" &&
            pagina === 1
        ) {
            return;
        }

        setCarregando(true);
        setBusca("");
        setNome("");
        setPagina(1);
    }

    function alterarStatus(
        valor: string
    ) {
        setCarregando(true);
        setPagina(1);

        if (!valor) {
            setStatus(undefined);
            return;
        }

        setStatus(
            Number(valor) as StatusProduto
        );
    }

    function formatarMoeda(
        valor: number
    ) {
        return valor.toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );
    }

    function formatarData(
        data: string
    ) {
        return new Date(data).toLocaleDateString(
            "pt-BR"
        );
    }

    return (
        <>
            <PageHeader
                title="Produtos"
                description="Gerencie seu catálogo, preços e disponibilidade de estoque."
                actions={
                    <Link
                        href="/produtos/novo"
                        className="button-primary"
                    >
                        <Plus size={16} />

                        Novo produto
                    </Link>
                }
            />

            {erro && (
                <div className="alert-error">
                    {erro}
                </div>
            )}

            <div className="filters-card">
                <form
                    className="products-filters"
                    onSubmit={pesquisar}
                >
                    <div className="filter-search">
                        <label htmlFor="busca">
                            Buscar produto
                        </label>

                        <div className="input-with-icon">
                            <Search
                                size={17}
                                className="input-icon"
                            />

                            <input
                                id="busca"
                                type="text"
                                value={busca}
                                onChange={(event) =>
                                    setBusca(
                                        event.target.value
                                    )
                                }
                                placeholder="Nome do produto"
                            />

                            {busca && (
                                <button
                                    type="button"
                                    className="input-clear"
                                    onClick={limparBusca}
                                    aria-label="Limpar busca"
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="filter-field">
                        <label htmlFor="status">
                            Status
                        </label>

                        <select
                            id="status"
                            value={status ?? ""}
                            onChange={(event) =>
                                alterarStatus(
                                    event.target.value
                                )
                            }
                        >
                            <option value="">
                                Todos
                            </option>

                            <option
                                value={StatusProduto.Ativo}
                            >
                                Ativos
                            </option>

                            <option
                                value={StatusProduto.Inativo}
                            >
                                Inativos
                            </option>
                        </select>
                    </div>

                    <div className="filter-field">
                        <label htmlFor="ordenar">
                            Ordenar por
                        </label>

                        <select
                            id="ordenar"
                            value={ordenarPor}
                            onChange={(event) => {
                                setCarregando(true);
                                setPagina(1);
                                setOrdenarPor(
                                    event.target.value
                                );
                            }}
                        >
                            <option value="nome">
                                Nome
                            </option>

                            <option value="preco">
                                Preço
                            </option>

                            <option value="estoque">
                                Estoque
                            </option>

                            <option value="status">
                                Status
                            </option>

                            <option value="datacriacao">
                                Data de criação
                            </option>
                        </select>
                    </div>

                    <div className="filter-field">
                        <label htmlFor="direcao">
                            Direção
                        </label>

                        <select
                            id="direcao"
                            value={direcao}
                            onChange={(event) => {
                                setCarregando(true);
                                setPagina(1);
                                setDirecao(
                                    event.target.value as "asc" | "desc"
                                );
                            }}
                        >
                            <option value="asc">
                                Crescente
                            </option>

                            <option value="desc">
                                Decrescente
                            </option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className="button-primary filter-button"
                        disabled={carregando}
                    >
                        <Search size={16} />

                        Pesquisar
                    </button>
                </form>
            </div>

            <div className="content-card">
                <div className="content-card-header">
                    <div>
                        <h2>Catálogo</h2>

                        <p>
                            {totalItens === 1
                                ? "1 produto encontrado"
                                : `${totalItens} produtos encontrados`}
                        </p>
                    </div>
                </div>

                {carregando ? (
                    <div className="table-loading">
                        <div className="spinner" />

                        <span>
                            Carregando produtos...
                        </span>
                    </div>
                ) : produtos.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <PackageOpen size={26} />
                        </div>

                        <h3>
                            Nenhum produto encontrado
                        </h3>

                        <p>
                            Altere os filtros ou cadastre
                            um novo produto.
                        </p>

                        <Link
                            href="/produtos/novo"
                            className="button-primary"
                        >
                            <Plus size={16} />

                            Novo produto
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="table-responsive">
                            <table className="data-table modern-table">
                                <thead>
                                    <tr>
                                        <th>Produto</th>
                                        <th>Preço</th>
                                        <th>Estoque</th>
                                        <th>Status</th>
                                        <th>Cadastro</th>
                                        <th className="table-actions-column">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {produtos.map(
                                        (produto) => (
                                            <tr key={produto.id}>
                                                <td>
                                                    <div className="product-cell">
                                                        <div className="product-avatar">
                                                            {produto.nome
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>

                                                        <div>
                                                            <strong>
                                                                {produto.nome}
                                                            </strong>

                                                            {produto.descricao && (
                                                                <span>
                                                                    {produto.descricao}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="table-money">
                                                    {formatarMoeda(
                                                        produto.preco
                                                    )}
                                                </td>

                                                <td>
                                                    <span
                                                        className={
                                                            produto.quantidadeEstoque === 0
                                                                ? "stock stock-empty"
                                                                : produto.quantidadeEstoque <= 5
                                                                    ? "stock stock-low"
                                                                    : "stock"
                                                        }
                                                    >
                                                        {produto.quantidadeEstoque === 0
                                                            ? "Sem estoque"
                                                            : `${produto.quantidadeEstoque} un.`}
                                                    </span>
                                                </td>

                                                <td>
                                                    {produto.status ===
                                                        StatusProduto.Ativo ? (
                                                        <Badge variant="success">
                                                            Ativo
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="neutral">
                                                            Inativo
                                                        </Badge>
                                                    )}
                                                </td>

                                                <td className="table-muted">
                                                    {formatarData(
                                                        produto.dataCriacao
                                                    )}
                                                </td>

                                                <td className="table-actions-column">
                                                    <Link
                                                        href={`/produtos/${produto.id}`}
                                                        className="table-action"
                                                    >
                                                        <Pencil size={15} />

                                                        Editar
                                                    </Link>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="pagination-modern">
                            <div className="pagination-info">
                                Página{" "}
                                <strong>{pagina}</strong>
                                {" de "}
                                <strong>
                                    {totalPaginas}
                                </strong>
                            </div>

                            <div className="pagination-buttons">
                                <button
                                    type="button"
                                    className="button-secondary pagination-button"
                                    disabled={
                                        pagina <= 1 ||
                                        carregando
                                    }
                                    onClick={() => {
                                        setCarregando(true);
                                        setPagina(
                                            pagina - 1
                                        );
                                    }}
                                >
                                    <ChevronLeft size={16} />

                                    Anterior
                                </button>

                                <button
                                    type="button"
                                    className="button-secondary pagination-button"
                                    disabled={
                                        pagina >= totalPaginas ||
                                        carregando
                                    }
                                    onClick={() => {
                                        setCarregando(true);
                                        setPagina(
                                            pagina + 1
                                        );
                                    }}
                                >
                                    Próxima

                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}