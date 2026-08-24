import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ApiError } from "@/services/api";
import { listarPedidos } from "@/services/pedidosService";
import {
  PedidoResumo,
  StatusPedido
} from "@/types/pedido";

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoResumo[]>([]);

  const [status, setStatus] = useState<
    StatusPedido | undefined
  >();

  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");

  const [valorMinimo, setValorMinimo] = useState("");
  const [valorMaximo, setValorMaximo] = useState("");

  const [filtroDataInicial, setFiltroDataInicial] = useState("");
  const [filtroDataFinal, setFiltroDataFinal] = useState("");
  const [filtroValorMinimo, setFiltroValorMinimo] = useState("");
  const [filtroValorMaximo, setFiltroValorMaximo] = useState("");

  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalItens, setTotalItens] = useState(0);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarPedidos() {
    try {
      setCarregando(true);
      setErro("");

      const resultado = await listarPedidos({
        pagina,
        tamanhoPagina: 50,
        status,
        dataInicial: filtroDataInicial || undefined,
        dataFinal: filtroDataFinal || undefined,
        valorMinimo: filtroValorMinimo
          ? Number(filtroValorMinimo)
          : undefined,
        valorMaximo: filtroValorMaximo
          ? Number(filtroValorMaximo)
          : undefined
      });

      setPedidos(resultado.itens);
      setTotalPaginas(resultado.totalPaginas);
      setTotalItens(resultado.totalItens);
    } catch (error) {
      if (error instanceof ApiError) {
        setErro(error.message);
      } else {
        setErro(
          "Não foi possível carregar os pedidos."
        );
      }
    } finally {
      setCarregando(false);
    }
  }

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

  function pesquisar(event: FormEvent) {
    event.preventDefault();

    setPagina(1);
    setFiltroDataInicial(dataInicial);
    setFiltroDataFinal(dataFinal);
    setFiltroValorMinimo(valorMinimo);
    setFiltroValorMaximo(valorMaximo);
  }

  function limparFiltros() {
    setStatus(undefined);

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

  function descricaoStatus(
    statusPedido: StatusPedido
  ) {
    switch (statusPedido) {
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

  return (
    <>
      <h1>Pedidos</h1>

      <div className="page-actions">
        <Link
          href="/pedidos/novo"
          className="button-primary"
        >
          Novo Pedido
        </Link>
      </div>

      <form
        onSubmit={pesquisar}
        className="filters"
      >
        <div className="form-group">
          <label htmlFor="status">
            Status
          </label>

          <select
            id="status"
            value={status ?? ""}
            onChange={(event) => {
              const valor = event.target.value;

              setStatus(
                valor
                  ? Number(valor) as StatusPedido
                  : undefined
              );

              setPagina(1);
            }}
          >
            <option value="">
              Todos
            </option>

            <option value={StatusPedido.Pendente}>
              Pendente
            </option>

            <option value={StatusPedido.Processando}>
              Processando
            </option>

            <option value={StatusPedido.Concluido}>
              Concluído
            </option>

            <option value={StatusPedido.Cancelado}>
              Cancelado
            </option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="dataInicial">
            Data inicial
          </label>

          <input
            id="dataInicial"
            type="date"
            value={dataInicial}
            onChange={(event) =>
              setDataInicial(event.target.value)
            }
          />
        </div>

        <div className="form-group">
          <label htmlFor="dataFinal">
            Data final
          </label>

          <input
            id="dataFinal"
            type="date"
            value={dataFinal}
            onChange={(event) =>
              setDataFinal(event.target.value)
            }
          />
        </div>

        <div className="form-group">
          <label htmlFor="valorMinimo">
            Valor mínimo
          </label>

          <input
            id="valorMinimo"
            type="number"
            min="0"
            step="0.01"
            value={valorMinimo}
            onChange={(event) =>
              setValorMinimo(event.target.value)
            }
          />
        </div>

        <div className="form-group">
          <label htmlFor="valorMaximo">
            Valor máximo
          </label>

          <input
            id="valorMaximo"
            type="number"
            min="0"
            step="0.01"
            value={valorMaximo}
            onChange={(event) =>
              setValorMaximo(event.target.value)
            }
          />
        </div>

        <button type="submit">
          Pesquisar
        </button>

        <button
          type="button"
          onClick={limparFiltros}
        >
          Limpar
        </button>
      </form>

      <p>
        Total de pedidos: {totalItens}
      </p>

      {carregando && (
        <p>
          Carregando pedidos...
        </p>
      )}

      {erro && (
        <div className="alert-error">
          {erro}
        </div>
      )}

      {!carregando &&
        !erro &&
        pedidos.length === 0 && (
          <p>
            Nenhum pedido encontrado.
          </p>
        )}

      {!carregando &&
        !erro &&
        pedidos.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Id</th>
                <th>Data</th>
                <th>Status</th>
                <th>Produtos</th>
                <th>Desconto</th>
                <th>Total</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {pedidos.map((pedido) => (
                <tr key={pedido.id}>
                  <td>
                    {pedido.id}
                  </td>

                  <td>
                    {new Date(
                      pedido.dataCriacao
                    ).toLocaleString("pt-BR")}
                  </td>

                  <td>
                    {descricaoStatus(
                      pedido.status
                    )}
                  </td>

                  <td>
                    {pedido.valorProdutos.toLocaleString(
                      "pt-BR",
                      {
                        style: "currency",
                        currency: "BRL"
                      }
                    )}
                  </td>

                  <td>
                    {pedido.desconto.toLocaleString(
                      "pt-BR",
                      {
                        style: "currency",
                        currency: "BRL"
                      }
                    )}
                  </td>

                  <td>
                    {pedido.valorTotal.toLocaleString(
                      "pt-BR",
                      {
                        style: "currency",
                        currency: "BRL"
                      }
                    )}
                  </td>

                  <td>
                    <Link
                      href={`/pedidos/${pedido.id}`}
                      className="table-link"
                    >
                      Detalhes
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      {!carregando &&
        !erro &&
        totalPaginas > 0 && (
          <div className="pagination">
            <button
              type="button"
              disabled={pagina <= 1}
              onClick={() =>
                setPagina((atual) => atual - 1)
              }
            >
              Anterior
            </button>

            <span>
              Página {pagina} de {totalPaginas}
            </span>

            <button
              type="button"
              disabled={pagina >= totalPaginas}
              onClick={() =>
                setPagina((atual) => atual + 1)
              }
            >
              Próxima
            </button>
          </div>
        )}
    </>
  );
}