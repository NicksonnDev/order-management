using OrderManagement.Domain.Enums;

namespace OrderManagement.Application.DTOs.Pedidos
{
    public class PedidoResumoResponse
    {
        public long Id { get; set; }

        public DateTime DataCriacao { get; set; }

        public StatusPedido Status { get; set; }

        public decimal ValorProdutos { get; set; }

        public decimal Desconto { get; set; }

        public decimal ValorTotal { get; set; }
    }
}