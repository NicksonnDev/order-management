import { apiFetch } from "@/services/api";
import { ResultadoPaginado } from "@/types/paginacao";
import {
  AtualizarStatusPedidoRequest,
  CriarPedidoRequest,
  ListarPedidosParams,
  Pedido,
  PedidoResumo
} from "@/types/pedido";

export async function listarPedidos(
  filtros: ListarPedidosParams = {}
): Promise<ResultadoPaginado<PedidoResumo>> {
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

  if (filtros.status) {
    params.set(
      "status",
      filtros.status.toString()
    );
  }

  if (filtros.dataInicial) {
    params.set(
      "dataInicial",
      filtros.dataInicial
    );
  }

  if (filtros.dataFinal) {
    params.set(
      "dataFinal",
      filtros.dataFinal
    );
  }

  if (filtros.valorMinimo !== undefined) {
    params.set(
      "valorMinimo",
      filtros.valorMinimo.toString()
    );
  }

  if (filtros.valorMaximo !== undefined) {
    params.set(
      "valorMaximo",
      filtros.valorMaximo.toString()
    );
  }

  const query = params.toString();

  return apiFetch<ResultadoPaginado<PedidoResumo>>(
    `/Pedidos${query ? `?${query}` : ""}`
  );
}

export async function obterPedidoPorId(
  id: number
): Promise<Pedido> {
  return apiFetch<Pedido>(
    `/Pedidos/${id}`
  );
}

export async function criarPedido(
  request: CriarPedidoRequest,
  chaveIdempotencia: string
): Promise<Pedido> {
  return apiFetch<Pedido>(
    "/Pedidos",
    {
      method: "POST",
      headers: {
        "Idempotency-Key": chaveIdempotencia
      },
      body: JSON.stringify(request)
    }
  );
}

export async function atualizarStatusPedido(
  id: number,
  request: AtualizarStatusPedidoRequest
): Promise<Pedido> {
  return apiFetch<Pedido>(
    `/Pedidos/${id}/status`,
    {
      method: "PUT",
      body: JSON.stringify(request)
    }
  );
}