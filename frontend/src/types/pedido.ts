export enum StatusPedido {
  Pendente = 1,
  Processando = 2,
  Concluido = 3,
  Cancelado = 4
}

export interface ItemPedido {
  id: number;
  produtoId: number;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
  valorTotal: number;
}

export interface Pedido {
  id: number;
  dataCriacao: string;
  dataAtualizacao: string;
  status: StatusPedido;
  valorProdutos: number;
  desconto: number;
  valorTotal: number;
  itens: ItemPedido[];
}

export interface PedidoResumo {
  id: number;
  dataCriacao: string;
  status: StatusPedido;
  valorProdutos: number;
  desconto: number;
  valorTotal: number;
}

export interface ItemCriarPedidoRequest {
  produtoId: number;
  quantidade: number;
}

export interface CriarPedidoRequest {
  itens: ItemCriarPedidoRequest[];
}

export interface AtualizarStatusPedidoRequest {
  status: StatusPedido;
}

export interface ListarPedidosParams {
  pagina?: number;
  tamanhoPagina?: number;
  status?: StatusPedido;
  dataInicial?: string;
  dataFinal?: string;
  valorMinimo?: number;
  valorMaximo?: number;
}