import {
  useEffect,
  useState
} from "react";
import Link from "next/link";
import {
  ArrowRight,
  Box,          
  Clock3,
  Package,
  Plus,
  ShoppingBag,
  ShoppingCart,
  TrendingUp
} from "lucide-react";
import { ApiError } from "@/services/api";
import { listarProdutos } from "@/services/produtosService";
import { listarPedidos } from "@/services/pedidosService";
import {
  StatusProduto
} from "@/types/produto";
import {
  PedidoResumo,
  StatusPedido
} from "@/types/pedido";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";

interface DashboardDados {
  totalProdutos: number;
  produtosAtivos: number;
  totalPedidos: number;
  pedidosPendentes: number;
  pedidosProcessando: number;
  pedidosConcluidos: number;
  pedidosCancelados: number;
  ultimosPedidos: PedidoResumo[];
}

export default function DashboardPage() {
  const [dados, setDados] =
    useState<DashboardDados>({
      totalProdutos: 0,
      produtosAtivos: 0,
      totalPedidos: 0,
      pedidosPendentes: 0,
      pedidosProcessando: 0,
      pedidosConcluidos: 0,
      pedidosCancelados: 0,
      ultimosPedidos: []
    });

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

    useEffect(() => {
        let cancelado = false;

        Promise.all([
            listarProdutos({
                pagina: 1,
                tamanhoPagina: 1,
                ordenarPor: "nome",
                direcao: "asc"
            }),

            listarProdutos({
                pagina: 1,
                tamanhoPagina: 1,
                status: StatusProduto.Ativo,
                ordenarPor: "nome",
                direcao: "asc"
            }),

            listarPedidos({
                pagina: 1,
                tamanhoPagina: 5
            }),

            listarPedidos({
                pagina: 1,
                tamanhoPagina: 1,
                status: StatusPedido.Pendente
            }),

            listarPedidos({
                pagina: 1,
                tamanhoPagina: 1,
                status: StatusPedido.Processando
            }),

            listarPedidos({
                pagina: 1,
                tamanhoPagina: 1,
                status: StatusPedido.Concluido
            }),

            listarPedidos({
                pagina: 1,
                tamanhoPagina: 1,
                status: StatusPedido.Cancelado
            })
        ])
            .then(([
                produtos,
                produtosAtivos,
                pedidos,
                pendentes,
                processando,
                concluidos,
                cancelados
            ]) => {
                if (cancelado) {
                    return;
                }

                setDados({
                    totalProdutos:
                        produtos.totalItens,

                    produtosAtivos:
                        produtosAtivos.totalItens,

                    totalPedidos:
                        pedidos.totalItens,

                    pedidosPendentes:
                        pendentes.totalItens,

                    pedidosProcessando:
                        processando.totalItens,

                    pedidosConcluidos:
                        concluidos.totalItens,

                    pedidosCancelados:
                        cancelados.totalItens,

                    ultimosPedidos:
                        pedidos.itens
                });
            })
            .catch((error) => {
                if (cancelado) {
                    return;
                }

                if (error instanceof ApiError) {
                    setErro(
                        error.message
                    );
                } else {
                    setErro(
                        "Não foi possível carregar os dados do dashboard."
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
    }, []);

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
    ).toLocaleDateString(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }
    );
  }

  function obterBadgeStatus(
    status: StatusPedido
  ) {
    switch (status) {
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

  const produtosInativos =
    dados.totalProdutos -
    dados.produtosAtivos;

  const pedidosEmAndamento =
    dados.pedidosPendentes +
    dados.pedidosProcessando;

  function percentualPedidos(
    quantidade: number
  ) {
    if (
      dados.totalPedidos === 0
    ) {
      return 0;
    }

    return Math.round(
      (
        quantidade /
        dados.totalPedidos
      ) * 100
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Acompanhe os principais indicadores da operação."
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

      {carregando ? (
        <div className="dashboard-loading">
          <div className="spinner" />

          <span>
            Carregando indicadores...
          </span>
        </div>
      ) : (
        <>
          <div className="dashboard-metrics">
            <Link
              href="/produtos"
              className="dashboard-metric-card"
            >
              <div className="metric-header">
                <div className="metric-icon">
                  <Package size={18} />
                </div>

                <ArrowRight
                  size={15}
                  className="metric-arrow"
                />
              </div>

              <div className="metric-content">
                <span>
                  Produtos cadastrados
                </span>

                <strong>
                  {dados.totalProdutos}
                </strong>

                <small>
                  {produtosInativos}
                  {" "}
                  {produtosInativos === 1
                    ? "produto inativo"
                    : "produtos inativos"}
                </small>
              </div>
            </Link>

            <Link
              href="/produtos"
              className="dashboard-metric-card"
            >
              <div className="metric-header">
                <div className="metric-icon metric-icon-success">
                  <Box size={18} />
                </div>

                <ArrowRight
                  size={15}
                  className="metric-arrow"
                />
              </div>

              <div className="metric-content">
                <span>
                  Produtos ativos
                </span>

                <strong>
                  {dados.produtosAtivos}
                </strong>

                <small>
                  Disponíveis para novos pedidos
                </small>
              </div>
            </Link>

            <Link
              href="/pedidos"
              className="dashboard-metric-card"
            >
              <div className="metric-header">
                <div className="metric-icon">
                  <ShoppingBag size={18} />
                </div>

                <ArrowRight
                  size={15}
                  className="metric-arrow"
                />
              </div>

              <div className="metric-content">
                <span>
                  Pedidos
                </span>

                <strong>
                  {dados.totalPedidos}
                </strong>

                <small>
                  Total registrado no sistema
                </small>
              </div>
            </Link>

            <Link
              href="/pedidos"
              className="dashboard-metric-card"
            >
              <div className="metric-header">
                <div className="metric-icon metric-icon-warning">
                  <Clock3 size={18} />
                </div>

                <ArrowRight
                  size={15}
                  className="metric-arrow"
                />
              </div>

              <div className="metric-content">
                <span>
                  Em andamento
                </span>

                <strong>
                  {pedidosEmAndamento}
                </strong>

                <small>
                  Pendentes ou processando
                </small>
              </div>
            </Link>
          </div>

          <div className="dashboard-grid">
            <section className="dashboard-card dashboard-orders-card">
              <div className="dashboard-card-header">
                <div>
                  <h2>
                    Últimos pedidos
                  </h2>

                  <p>
                    Pedidos mais recentes registrados
                    no sistema.
                  </p>
                </div>

                <Link
                  href="/pedidos"
                  className="dashboard-card-link"
                >
                  Ver todos

                  <ArrowRight size={14} />
                </Link>
              </div>

              {dados.ultimosPedidos.length === 0 ? (
                <div className="dashboard-empty">
                  <ShoppingCart
                    size={25}
                  />

                  <strong>
                    Nenhum pedido
                  </strong>

                  <span>
                    Os pedidos criados aparecerão
                    aqui.
                  </span>

                  <Link
                    href="/pedidos/novo"
                    className="button-primary"
                  >
                    <Plus size={15} />

                    Criar pedido
                  </Link>
                </div>
              ) : (
                <div className="dashboard-orders-list">
                  {dados.ultimosPedidos.map(
                    (pedido) => (
                      <Link
                        key={pedido.id}
                        href={`/pedidos/${pedido.id}`}
                        className="dashboard-order-item"
                      >
                        <div className="dashboard-order-main">
                          <div className="dashboard-order-icon">
                            <ShoppingBag
                              size={16}
                            />
                          </div>

                          <div>
                            <strong>
                              Pedido #{pedido.id}
                            </strong>

                            <span>
                              {formatarData(
                                pedido.dataCriacao
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="dashboard-order-status">
                          {obterBadgeStatus(
                            pedido.status
                          )}
                        </div>

                        <strong className="dashboard-order-value">
                          {formatarMoeda(
                            pedido.valorTotal
                          )}
                        </strong>

                        <ArrowRight
                          size={15}
                          className="dashboard-order-arrow"
                        />
                      </Link>
                    )
                  )}
                </div>
              )}
            </section>

            <section className="dashboard-card">
              <div className="dashboard-card-header">
                <div>
                  <h2>
                    Status dos pedidos
                  </h2>

                  <p>
                    Distribuição atual dos pedidos.
                  </p>
                </div>
              </div>

              <div className="dashboard-status-list">
                <div className="dashboard-status-item">
                  <div className="dashboard-status-title">
                    <div>
                      <span className="status-indicator status-indicator-warning" />

                      <strong>
                        Pendente
                      </strong>
                    </div>

                    <span>
                      {dados.pedidosPendentes}
                    </span>
                  </div>

                  <div className="dashboard-progress">
                    <div
                      className="dashboard-progress-bar progress-warning"
                      style={{
                        width:
                          `${percentualPedidos(
                            dados.pedidosPendentes
                          )}%`
                      }}
                    />
                  </div>

                  <small>
                    {percentualPedidos(
                      dados.pedidosPendentes
                    )}
                    % dos pedidos
                  </small>
                </div>

                <div className="dashboard-status-item">
                  <div className="dashboard-status-title">
                    <div>
                      <span className="status-indicator status-indicator-info" />

                      <strong>
                        Processando
                      </strong>
                    </div>

                    <span>
                      {dados.pedidosProcessando}
                    </span>
                  </div>

                  <div className="dashboard-progress">
                    <div
                      className="dashboard-progress-bar progress-info"
                      style={{
                        width:
                          `${percentualPedidos(
                            dados.pedidosProcessando
                          )}%`
                      }}
                    />
                  </div>

                  <small>
                    {percentualPedidos(
                      dados.pedidosProcessando
                    )}
                    % dos pedidos
                  </small>
                </div>

                <div className="dashboard-status-item">
                  <div className="dashboard-status-title">
                    <div>
                      <span className="status-indicator status-indicator-success" />

                      <strong>
                        Concluído
                      </strong>
                    </div>

                    <span>
                      {dados.pedidosConcluidos}
                    </span>
                  </div>

                  <div className="dashboard-progress">
                    <div
                      className="dashboard-progress-bar progress-success"
                      style={{
                        width:
                          `${percentualPedidos(
                            dados.pedidosConcluidos
                          )}%`
                      }}
                    />
                  </div>

                  <small>
                    {percentualPedidos(
                      dados.pedidosConcluidos
                    )}
                    % dos pedidos
                  </small>
                </div>

                <div className="dashboard-status-item">
                  <div className="dashboard-status-title">
                    <div>
                      <span className="status-indicator status-indicator-danger" />

                      <strong>
                        Cancelado
                      </strong>
                    </div>

                    <span>
                      {dados.pedidosCancelados}
                    </span>
                  </div>

                  <div className="dashboard-progress">
                    <div
                      className="dashboard-progress-bar progress-danger"
                      style={{
                        width:
                          `${percentualPedidos(
                            dados.pedidosCancelados
                          )}%`
                      }}
                    />
                  </div>

                  <small>
                    {percentualPedidos(
                      dados.pedidosCancelados
                    )}
                    % dos pedidos
                  </small>
                </div>
              </div>
            </section>
          </div>

          <section className="dashboard-quick-actions">
            <div className="quick-actions-title">
              <div className="quick-actions-icon">
                <TrendingUp
                  size={18}
                />
              </div>

              <div>
                <strong>
                  Ações rápidas
                </strong>

                <span>
                  Acesse as principais operações
                  do sistema.
                </span>
              </div>
            </div>

            <div className="quick-actions-buttons">
              <Link
                href="/produtos/novo"
                className="button-secondary"
              >
                <Plus size={15} />

                Novo produto
              </Link>

              <Link
                href="/pedidos/novo"
                className="button-primary"
              >
                <Plus size={15} />

                Novo pedido
              </Link>
            </div>
          </section>
        </>
      )}
    </>
  );
}