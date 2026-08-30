import {
    FormEvent,
    useEffect,
    useState
} from "react";
import Link from "next/link";
import {
    ChevronLeft,
    ChevronRight,
    Eye,
    Plus,
    Search,
    ShoppingBag,
    X
} from "lucide-react";
import { ApiError } from "@/services/api";
import { listarPedidos } from "@/services/pedidosService";
import {
    PedidoResumo,
    StatusPedido
} from "@/types/pedido";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";

export default function PedidosPage() {
    const [pedidos, setPedidos] =
        useState<PedidoResumo[]>([]);

    const [pagina, setPagina] =
        useState(1);

    const [totalPaginas, setTotalPaginas] =
        useState(0);

    const [totalItens, setTotalItens] =
        useState(0);

    const [status, setStatus] =
        useState<StatusPedido | undefined>();

    const [dataInicial, setDataInicial] =
        useState("");

    const [dataFinal, setDataFinal] =
        useState("");

    const [valorMinimo, setValorMinimo] =
        useState("");

    const [valorMaximo, setValorMaximo] =
        useState("");

    const [filtroDataInicial, setFiltroDataInicial] =
        useState("");

    const [filtroDataFinal, setFiltroDataFinal] =
        useState("");

    const [filtroValorMinimo, setFiltroValorMinimo] =
        useState("");

    const [filtroValorMaximo, setFiltroValorMaximo] =
        useState("");

    const [carregando, setCarregando] =
        useState(true);

    const [erro, setErro] =
        useState("");

    useEffect(() => {
        carregarPedidos();
    }, [
        pagina,
        status,
        filtroDataInicial,
        filtroDataFinal,
        filtroValorMinimo,
        filtroValorMaximo
    ]);

    async function carregarPedidos() {
        try {
            setCarregando(true);
            setErro("");

            const resultado =
                await listarPedidos({
                    pagina,
                    tamanhoPagina: 50,
                    status,
                    dataInicial:
                        filtroDataInicial ||
                        undefined,
                    dataFinal:
                        filtroDataFinal ||
                        undefined,
                    valorMinimo:
                        filtroValorMinimo
                            ? Number(
                                filtroValorMinimo
                            )
                            : undefined,
                    valorMaximo:
                        filtroValorMaximo
                            ? Number(
                                filtroValorMaximo
                            )
                            : undefined
                });

            setPedidos(
                resultado.itens
            );

            setTotalPaginas(
                resultado.totalPaginas
            );

            setTotalItens(
                resultado.totalItens
            );
        } catch (error) {
            if (error instanceof ApiError) {
                setErro(
                    error.message
                );
            } else {
                setErro(
                    "Não foi possível carregar os pedidos."
                );
            }
        } finally {
            setCarregando(false);
        }
    }

    function pesquisar(
        event: FormEvent
    ) {
        event.preventDefault();

        setPagina(1);

        setFiltroDataInicial(
            dataInicial
        );

        setFiltroDataFinal(
            dataFinal
        );

        setFiltroValorMinimo(
            valorMinimo
        );

        setFiltroValorMaximo(
            valorMaximo
        );
    }

    function alterarStatus(
        valor: string
    ) {
        setPagina(1);

        if (!valor) {
            setStatus(
                undefined
            );

            return;
        }

        setStatus(
            Number(
                valor
            ) as StatusPedido
        );
    }

    function limparFiltros() {
        setStatus(
            undefined
        );

        setDataInicial("");
        setDataFinal("");
        setValorMinimo("");
        setValorMaximo("");

        setFiltroDataInicial("");
        setFiltroDataFinal("");
        setFiltroValorMinimo("");
        setFiltroValorMaximo("");

        setPagina(1);
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
        return new Date(
            data
        ).toLocaleString(
            "pt-BR"
        );
    }

    function statusPedido(
        statusPedido: StatusPedido
    ) {
        switch (
        statusPedido
        ) {
            case StatusPedido.Pendente:
                return (
                    <Badge variant="warning">
                        Pendente
                    </Badge>
                );

            case StatusPedido.Processando:
                return (
                    <Badge variant="info">
                        Processando
                    </Badge>
                );

            case StatusPedido.Concluido:
                return (
                    <Badge variant="success">
                        Concluído
                    </Badge>
                );

            case StatusPedido.Cancelado:
                return (
                    <Badge variant="danger">
                        Cancelado
                    </Badge>
                );

            default:
                return (
                    <Badge variant="neutral">
                        Desconhecido
                    </Badge>
                );
        }
    }

    const possuiFiltros =
        status !== undefined ||
        dataInicial ||
        dataFinal ||
        valorMinimo ||
        valorMaximo;

    return (
        <>
            <PageHeader
                title="Pedidos"
                description="Acompanhe os pedidos, valores e etapas do processamento."
                actions={
                    <Link
                        href="/pedidos/novo"
                        className="button-primary"
                    >
                        <Plus size={16} />

                        Novo pedido
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
                    className="orders-filters"
                    onSubmit={pesquisar}
                >
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
                                value={
                                    StatusPedido.Pendente
                                }
                            >
                                Pendente
                            </option>

                            <option
                                value={
                                    StatusPedido.Processando
                                }
                            >
                                Processando
                            </option>

                            <option
                                value={
                                    StatusPedido.Concluido
                                }
                            >
                                Concluído
                            </option>

                            <option
                                value={
                                    StatusPedido.Cancelado
                                }
                            >
                                Cancelado
                            </option>
                        </select>
                    </div>

                    <div className="filter-field">
                        <label htmlFor="dataInicial">
                            Data inicial
                        </label>

                        <input
                            id="dataInicial"
                            type="date"
                            value={dataInicial}
                            onChange={(event) =>
                                setDataInicial(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div className="filter-field">
                        <label htmlFor="dataFinal">
                            Data final
                        </label>

                        <input
                            id="dataFinal"
                            type="date"
                            value={dataFinal}
                            onChange={(event) =>
                                setDataFinal(
                                    event.target.value
                                )
                            }
                        />
                    </div>

                    <div className="filter-field">
                        <label htmlFor="valorMinimo">
                            Valor mínimo
                        </label>

                        <div className="money-filter">
                            <span>
                                R$
                            </span>

                            <input
                                id="valorMinimo"
                                type="number"
                                min="0"
                                step="0.01"
                                value={valorMinimo}
                                onChange={(event) =>
                                    setValorMinimo(
                                        event.target.value
                                    )
                                }
                                placeholder="0,00"
                            />
                        </div>
                    </div>

                    <div className="filter-field">
                        <label htmlFor="valorMaximo">
                            Valor máximo
                        </label>

                        <div className="money-filter">
                            <span>
                                R$
                            </span>

                            <input
                                id="valorMaximo"
                                type="number"
                                min="0"
                                step="0.01"
                                value={valorMaximo}
                                onChange={(event) =>
                                    setValorMaximo(
                                        event.target.value
                                    )
                                }
                                placeholder="0,00"
                            />
                        </div>
                    </div>

                    <div className="orders-filter-actions">
                        {possuiFiltros && (
                            <button
                                type="button"
                                className="button-secondary"
                                onClick={limparFiltros}
                            >
                                <X size={15} />

                                Limpar
                            </button>
                        )}

                        <button
                            type="submit"
                            className="button-primary"
                            disabled={carregando}
                        >
                            <Search size={16} />

                            Filtrar
                        </button>
                    </div>
                </form>
            </div>

            <div className="content-card">
                <div className="content-card-header">
                    <div>
                        <h2>
                            Histórico de pedidos
                        </h2>

                        <p>
                            {totalItens === 1
                                ? "1 pedido encontrado"
                                : `${totalItens} pedidos encontrados`}
                        </p>
                    </div>
                </div>

                {carregando ? (
                    <div className="table-loading">
                        <div className="spinner" />

                        <span>
                            Carregando pedidos...
                        </span>
                    </div>
                ) : pedidos.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <ShoppingBag
                                size={26}
                            />
                        </div>

                        <h3>
                            Nenhum pedido encontrado
                        </h3>

                        <p>
                            Altere os filtros utilizados
                            ou crie um novo pedido.
                        </p>

                        <Link
                            href="/pedidos/novo"
                            className="button-primary"
                        >
                            <Plus size={16} />

                            Novo pedido
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="table-responsive">
                            <table className="data-table modern-table">
                                <thead>
                                    <tr>
                                        <th>Pedido</th>
                                        <th>Data</th>
                                        <th>Status</th>
                                        <th>
                                            Produtos
                                        </th>
                                        <th>
                                            Desconto
                                        </th>
                                        <th>Total</th>
                                        <th className="table-actions-column">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {pedidos.map(
                                        (pedido) => (
                                            <tr key={pedido.id}>
                                                <td>
                                                    <div className="order-number">
                                                        <strong>
                                                            #{pedido.id}
                                                        </strong>
                                                    </div>
                                                </td>

                                                <td className="table-muted">
                                                    {formatarData(
                                                        pedido.dataCriacao
                                                    )}
                                                </td>

                                                <td>
                                                    {statusPedido(
                                                        pedido.status
                                                    )}
                                                </td>

                                                <td className="table-money">
                                                    {formatarMoeda(
                                                        pedido.valorProdutos
                                                    )}
                                                </td>

                                                <td>
                                                    {pedido.desconto > 0 ? (
                                                        <span className="discount-value">
                                                            -
                                                            {formatarMoeda(
                                                                pedido.desconto
                                                            )}
                                                        </span>
                                                    ) : (
                                                        <span className="table-muted">
                                                            —
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="order-total">
                                                    {formatarMoeda(
                                                        pedido.valorTotal
                                                    )}
                                                </td>

                                                <td className="table-actions-column">
                                                    <Link
                                                        href={`/pedidos/${pedido.id}`}
                                                        className="table-action"
                                                    >
                                                        <Eye size={15} />

                                                        Detalhes
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
                                <strong>
                                    {pagina}
                                </strong>
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
                                    onClick={() =>
                                        setPagina(
                                            pagina - 1
                                        )
                                    }
                                >
                                    <ChevronLeft
                                        size={16}
                                    />

                                    Anterior
                                </button>

                                <button
                                    type="button"
                                    className="button-secondary pagination-button"
                                    disabled={
                                        pagina >=
                                        totalPaginas ||
                                        carregando
                                    }
                                    onClick={() =>
                                        setPagina(
                                            pagina + 1
                                        )
                                    }
                                >
                                    Próxima

                                    <ChevronRight
                                        size={16}
                                    />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
}