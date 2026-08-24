import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ApiError } from "@/services/api";
import {
  atualizarStatusPedido,
  obterPedidoPorId
} from "@/services/pedidosService";
import {
  Pedido,
  StatusPedido
} from "@/types/pedido";

export default function PedidoDetalhesPage() {
  const router = useRouter();

  const { id } = router.query;

  const [pedido, setPedido] =
    useState<Pedido | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [alterandoStatus, setAlterandoStatus] =
    useState(false);

  const [erro, setErro] =
    useState("");

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const pedidoId = Number(id);

    if (!Number.isInteger(pedidoId) ||
        pedidoId <= 0) {
      setErro("Pedido inválido.");
      setCarregando(false);

      return;
    }

    carregarPedido(pedidoId);
  }, [router.isReady, id]);

  async function carregarPedido(
    pedidoId: number
  ) {
    try {
      setCarregando(true);
      setErro("");

      const resultado =
        await obterPedidoPorId(pedidoId);

      setPedido(resultado);
    } catch (error) {
      if (error instanceof ApiError) {
        setErro(error.message);
      } else {
        setErro(
          "Não foi possível carregar o pedido."
        );
      }
    } finally {
      setCarregando(false);
    }
  }

  async function alterarStatus(
    novoStatus: StatusPedido
  ) {
    if (!pedido) {
      return;
    }

    try {
      setAlterandoStatus(true);
      setErro("");

      const pedidoAtualizado =
        await atualizarStatusPedido(
          pedido.id,
          {
            status: novoStatus
          }
        );

      setPedido(pedidoAtualizado);
    } catch (error) {
      if (error instanceof ApiError) {
        setErro(error.message);
      } else {
        setErro(
          "Não foi possível alterar o status do pedido."
        );
      }
    } finally {
      setAlterandoStatus(false);
    }
  }

function confirmarCancelamento() {
  if (!pedido) {
    return;
  }

  const confirmou = window.confirm(
    "Deseja realmente cancelar este pedido? O estoque dos itens será devolvido."
  );

  if (!confirmou) {
    return;
  }

  alterarStatus(
    StatusPedido.Cancelado
  );
}

  function descricaoStatus(
    status: StatusPedido
  ) {
    switch (status) {
      case StatusPedido.Pendente:
        return "Pendente";

      case StatusPedido.Processando:
        return "Processando";

      case StatusPedido.Concluido:
        return "Concluído";

      case StatusPedido.Cancelado:
        return "Cancelado";

      default:
        return "Desconhecido";
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

  if (carregando) {
    return (
      <p>
        Carregando pedido...
      </p>
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
      <div className="page-header">
        <div>
          <h1>
            Pedido #{pedido.id}
          </h1>

          <p>
            Criado em{" "}
            {new Date(
              pedido.dataCriacao
            ).toLocaleString("pt-BR")}
          </p>
        </div>

        <Link
          href="/pedidos"
          className="button-secondary"
        >
          Voltar
        </Link>
      </div>

      {erro && (
        <div className="alert-error">
          {erro}
        </div>
      )}

      <div className="detail-card">
        <div className="detail-row">
          <span>Status</span>

          <strong>
            {descricaoStatus(
              pedido.status
            )}
          </strong>
        </div>

        <div className="detail-row">
          <span>Última atualização</span>

          <strong>
            {new Date(
              pedido.dataAtualizacao
            ).toLocaleString("pt-BR")}
          </strong>
        </div>
      </div>

      <h2>Itens</h2>

      <table className="data-table">
        <thead>
          <tr>
            <th>Produto</th>
            <th>Quantidade</th>
            <th>Preço unitário</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          {pedido.itens.map((item) => (
            <tr key={item.id}>
              <td>
                {item.produtoNome}
              </td>

              <td>
                {item.quantidade}
              </td>

              <td>
                {formatarMoeda(
                  item.precoUnitario
                )}
              </td>

              <td>
                {formatarMoeda(
                  item.valorTotal
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="totals-card">
        <div>
          <span>
            Valor dos produtos
          </span>

          <strong>
            {formatarMoeda(
              pedido.valorProdutos
            )}
          </strong>
        </div>

        <div>
          <span>
            Desconto
          </span>

          <strong>
            {formatarMoeda(
              pedido.desconto
            )}
          </strong>
        </div>

        <div className="total-final">
          <span>
            Total
          </span>

          <strong>
            {formatarMoeda(
              pedido.valorTotal
            )}
          </strong>
        </div>
      </div>



      <div className="status-actions">
        {pedido.status === StatusPedido.Pendente && (
          <>
            <button
              type="button"
              className="button-primary"
              disabled={alterandoStatus}
              onClick={() =>
                alterarStatus(
                  StatusPedido.Processando
                )
              }
            >
              Processar Pedido
            </button>

            <button
              type="button"
              className="button-danger"
              disabled={alterandoStatus}
              onClick={confirmarCancelamento}
            >
              Cancelar Pedido
            </button>
          </>
        )}

       {pedido.status === StatusPedido.Processando && (
          <>
            <button
              type="button"
              className="button-primary"
              disabled={alterandoStatus}
              onClick={() =>
                alterarStatus(
                  StatusPedido.Concluido
                )
              }
            >
              Concluir Pedido
            </button>

            <button
              type="button"
              className="button-danger"
              disabled={alterandoStatus}
              onClick={confirmarCancelamento}
            >
              Cancelar Pedido
            </button>
          </>
        )}
      </div>
    </>
  );
}