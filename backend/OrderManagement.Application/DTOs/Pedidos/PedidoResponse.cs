using OrderManagement.Domain.Enums;

namespace OrderManagement.Application.DTOs.Pedidos
{
    public class PedidoResponse
    {
        public long Id { get; set; }

        public DateTime DataCriacao { get; set; }

        public DateTime DataAtualizacao { get; set; }

        public StatusPedido Status { get; set; }

        public decimal ValorProdutos { get; set; }

        public decimal Desconto { get; set; }

        public decimal ValorTotal { get; set; }

        public List<ItemPedidoResponse> Itens { get; set; } =
            new List<ItemPedidoResponse>();
    }
}