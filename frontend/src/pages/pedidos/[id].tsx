import {
    useEffect,
    useState
} from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
    ArrowLeft,
    Check,
    CheckCircle2,
    Clock3,
    PackageCheck,
    Play,
    ShoppingBag,
    X,
    XCircle
} from "lucide-react";
import { ApiError } from "@/services/api";
import {
    atualizarStatusPedido,
    obterPedidoPorId
} from "@/services/pedidosService";
import {
    Pedido,
    StatusPedido
} from "@/types/pedido";

import PageHeader from "@/components/ui/PageHeader";

export default function PedidoDetalhesPage() {
    const router = useRouter();

    const { id } = router.query;

    const [pedido, setPedido] =
        useState<Pedido | null>(null);

    const [carregando, setCarregando] =
        useState(true);

    const [atualizando, setAtualizando] =
        useState(false);

    const [erro, setErro] =
        useState("");

    useEffect(() => {
        if (!router.isReady) {
            return;
        }

        const pedidoId = Number(id);

        if (
            !Number.isInteger(pedidoId) ||
            pedidoId <= 0
        ) {
            return;
        }

        let cancelado = false;

        obterPedidoPorId(pedidoId)
            .then((resultado) => {
                if (cancelado) {
                    return;
                }

                setPedido(resultado);
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
                        "Não foi possível carregar o pedido."
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
        router.isReady,
        id
    ]);


    async function alterarStatus(
        novoStatus: StatusPedido
    ) {
        if (!pedido) {
            return;
        }

        if (
            novoStatus === StatusPedido.Cancelado
        ) {
            const confirmar =
                window.confirm(
                    "Deseja realmente cancelar este pedido? O estoque dos itens será devolvido."
                );

            if (!confirmar) {
                return;
            }
        }

        try {
            setAtualizando(true);
            setErro("");

            const atualizado =
                await atualizarStatusPedido(
                    pedido.id,
                    {
                        status: novoStatus
                    }
                );

            setPedido(
                atualizado
            );
        } catch (error) {
            if (error instanceof ApiError) {
                setErro(
                    error.message
                );
            } else {
                setErro(
                    "Não foi possível atualizar o status do pedido."
                );
            }
        } finally {
            setAtualizando(false);
        }
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


    function etapaAtiva(
        etapa: StatusPedido
    ) {
        if (!pedido) {
            return false;
        }

        if (
            pedido.status === StatusPedido.Cancelado
        ) {
            return false;
        }

        return pedido.status === etapa;
    }

    function etapaConcluida(
        etapa: StatusPedido
    ) {
        if (!pedido) {
            return false;
        }

        if (
            pedido.status === StatusPedido.Cancelado
        ) {
            return false;
        }

        if (
            etapa === StatusPedido.Pendente
        ) {
            return (
                pedido.status === StatusPedido.Processando ||
                pedido.status === StatusPedido.Concluido
            );
        }

        if (
            etapa === StatusPedido.Processando
        ) {
            return (
                pedido.status === StatusPedido.Concluido
            );
        }

        return false;
    }

    const pedidoId =
        Number(id);

    const pedidoInvalido =
        router.isReady &&
        (
            !Number.isInteger(pedidoId) ||
            pedidoId <= 0
        );

    if (pedidoInvalido) {
        return (
            <>
                <div className="alert-error">
                    Pedido inválido.
                </div>

                <Link
                    href="/pedidos"
                    className="button-secondary"
                >
                    <ArrowLeft size={16} />

                    Voltar
                </Link>
            </>
        );
    }

    if (carregando) {
        return (
            <div className="page-loading">
                <div className="spinner" />

                <span>
                    Carregando pedido...
                </span>
            </div>
        );
    }

    if (erro && !pedido) {
        return (
            <>
                <div className="alert-error">
                    {erro}
                </div>

                <Link
                    href="/pedidos"
                    className="button-secondary"
                >
                    <ArrowLeft size={16} />

                    Voltar
                </Link>
            </>
        );
    }

    if (!pedido) {
        return null;
    }


    return (
        <>
            <PageHeader
                title={`Pedido #${pedido.id}`}
                description={`Criado em ${formatarData(
                    pedido.dataCriacao
                )}`}
                actions={
                    <Link
                        href="/pedidos"
                        className="button-secondary"
                    >
                        <ArrowLeft size={16} />

                        Voltar
                    </Link>
                }
            />

            {erro && (
                <div className="alert-error">
                    {erro}
                </div>
            )}

            <section className="form-section-card order-flow-card">
                <div className="form-section-header">
                    <div>
                        <h2>
                            Andamento do pedido
                        </h2>

                        <p>
                            Acompanhe a etapa atual do processamento.
                        </p>
                    </div>
                </div>

                <div className="form-section-body">
                    {pedido.status ===
                        StatusPedido.Cancelado ? (
                        <div className="order-cancelled-state">
                            <div className="order-cancelled-icon">
                                <XCircle size={24} />
                            </div>

                            <div>
                                <strong>
                                    Pedido cancelado
                                </strong>

                                <p>
                                    Este pedido foi cancelado e não
                                    possui novas ações disponíveis.
                                    O estoque reservado foi devolvido.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="order-timeline">
                            <div
                                className={
                                    etapaAtiva(
                                        StatusPedido.Pendente
                                    )
                                        ? "timeline-step active"
                                        : etapaConcluida(
                                            StatusPedido.Pendente
                                        )
                                            ? "timeline-step completed"
                                            : "timeline-step"
                                }
                            >
                                <div className="timeline-marker">
                                    {etapaConcluida(
                                        StatusPedido.Pendente
                                    ) ? (
                                        <Check size={16} />
                                    ) : (
                                        <Clock3 size={16} />
                                    )}
                                </div>

                                <div>
                                    <strong>
                                        Pendente
                                    </strong>

                                    <span>
                                        Pedido criado
                                    </span>
                                </div>
                            </div>

                            <div className="timeline-line" />

                            <div
                                className={
                                    etapaAtiva(
                                        StatusPedido.Processando
                                    )
                                        ? "timeline-step active"
                                        : etapaConcluida(
                                            StatusPedido.Processando
                                        )
                                            ? "timeline-step completed"
                                            : "timeline-step"
                                }
                            >
                                <div className="timeline-marker">
                                    {etapaConcluida(
                                        StatusPedido.Processando
                                    ) ? (
                                        <Check size={16} />
                                    ) : (
                                        <Play size={16} />
                                    )}
                                </div>

                                <div>
                                    <strong>
                                        Processando
                                    </strong>

                                    <span>
                                        Em processamento
                                    </span>
                                </div>
                            </div>

                            <div className="timeline-line" />

                            <div
                                className={
                                    etapaAtiva(
                                        StatusPedido.Concluido
                                    )
                                        ? "timeline-step active"
                                        : "timeline-step"
                                }
                            >
                                <div className="timeline-marker">
                                    <CheckCircle2 size={16} />
                                </div>

                                <div>
                                    <strong>
                                        Concluído
                                    </strong>

                                    <span>
                                        Pedido finalizado
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            <div className="order-details-grid">
                <section className="form-section-card">
                    <div className="form-section-header">
                        <div className="form-section-icon">
                            <ShoppingBag size={19} />
                        </div>

                        <div>
                            <h2>
                                Itens do pedido
                            </h2>

                            <p>
                                Produtos e valores registrados
                                no momento da compra.
                            </p>
                        </div>
                    </div>

                    <div className="order-items-table-wrapper">
                        <table className="modern-table order-items-table">
                            <thead>
                                <tr>
                                    <th>
                                        Produto
                                    </th>

                                    <th>
                                        Quantidade
                                    </th>

                                    <th>
                                        Preço unitário
                                    </th>

                                    <th>
                                        Total
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {pedido.itens.map(
                                    (item) => (
                                        <tr key={item.id}>
                                            <td>
                                                <div className="order-product-cell">
                                                    <div className="product-avatar">
                                                        {item.produtoNome
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <strong>
                                                            {item.produtoNome}
                                                        </strong>

                                                        <span>
                                                            Produto #{item.produtoId}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                {item.quantidade}
                                                {" un."}
                                            </td>

                                            <td className="table-money">
                                                {formatarMoeda(
                                                    item.precoUnitario
                                                )}
                                            </td>

                                            <td className="table-money">
                                                {formatarMoeda(
                                                    item.valorTotal
                                                )}
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <aside className="order-summary-card">
                    <div className="order-summary-header">
                        <div>
                            <h2>
                                Resumo financeiro
                            </h2>

                            <p>
                                Valores calculados pelo sistema.
                            </p>
                        </div>
                    </div>

                    <div className="order-summary-body">
                        <div className="summary-row">
                            <span>
                                Produtos
                            </span>

                            <strong>
                                {formatarMoeda(
                                    pedido.valorProdutos
                                )}
                            </strong>
                        </div>

                        <div className="summary-row">
                            <span>
                                Desconto
                            </span>

                            {pedido.desconto > 0 ? (
                                <strong className="summary-discount">
                                    -
                                    {formatarMoeda(
                                        pedido.desconto
                                    )}
                                </strong>
                            ) : (
                                <strong>
                                    {formatarMoeda(0)}
                                </strong>
                            )}
                        </div>

                        <div className="summary-divider" />

                        <div className="summary-row summary-total">
                            <span>
                                Total
                            </span>

                            <strong>
                                {formatarMoeda(
                                    pedido.valorTotal
                                )}
                            </strong>
                        </div>

                        <div className="summary-note">
                            Os valores e preços dos produtos
                            representam o momento em que o
                            pedido foi criado.
                        </div>
                    </div>
                </aside>
            </div>

            {(pedido.status === StatusPedido.Pendente ||
                pedido.status === StatusPedido.Processando) && (
                    <section className="order-actions-card">
                        <div className="order-actions-info">
                            <strong>
                                Ações do pedido
                            </strong>

                            <span>
                                Apenas transições válidas estão
                                disponíveis para o status atual.
                            </span>
                        </div>

                        <div className="order-actions-buttons">
                            <button
                                type="button"
                                className="button-danger"
                                disabled={atualizando}
                                onClick={() =>
                                    alterarStatus(
                                        StatusPedido.Cancelado
                                    )
                                }
                            >
                                <X size={16} />

                                Cancelar pedido
                            </button>

                            {pedido.status ===
                                StatusPedido.Pendente && (
                                    <button
                                        type="button"
                                        className="button-primary"
                                        disabled={atualizando}
                                        onClick={() =>
                                            alterarStatus(
                                                StatusPedido.Processando
                                            )
                                        }
                                    >
                                        <Play size={16} />

                                        {atualizando
                                            ? "Atualizando..."
                                            : "Iniciar processamento"}
                                    </button>
                                )}

                            {pedido.status ===
                                StatusPedido.Processando && (
                                    <button
                                        type="button"
                                        className="button-primary"
                                        disabled={atualizando}
                                        onClick={() =>
                                            alterarStatus(
                                                StatusPedido.Concluido
                                            )
                                        }
                                    >
                                        <PackageCheck size={16} />

                                        {atualizando
                                            ? "Atualizando..."
                                            : "Concluir pedido"}
                                    </button>
                                )}
                        </div>
                    </section>
                )}
        </>
    );
}