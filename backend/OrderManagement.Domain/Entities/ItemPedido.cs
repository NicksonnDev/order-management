namespace OrderManagement.Domain.Entities
{
    public class ItemPedido
    {
        public long Id { get; set; }

        public long PedidoId { get; set; }

        public long ProdutoId { get; set; }

        public int Quantidade { get; set; }

        public decimal PrecoUnitario { get; set; }

        public decimal ValorTotal { get; set; }

        public Pedido Pedido { get; set; } = null!;

        public Produto Produto { get; set; } = null!;
    }
}