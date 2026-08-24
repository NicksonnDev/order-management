using OrderManagement.Domain.Enums;

namespace OrderManagement.Domain.Entities
{
    public class Pedido
    {
        public long Id { get; set; }

        public DateTime DataCriacao { get; set; }

        public DateTime DataAtualizacao { get; set; }

        public StatusPedido Status { get; set; }

        public decimal ValorProdutos { get; set; }

        public decimal Desconto { get; set; }

        public decimal ValorTotal { get; set; }

        public ICollection<ItemPedido> Itens { get; set; } =
            new List<ItemPedido>();
    }
}