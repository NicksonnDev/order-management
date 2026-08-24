namespace OrderManagement.Application.DTOs.Pedidos
{
    public class ItemPedidoRequest
    {
        public long ProdutoId { get; set; }

        public int Quantidade { get; set; }
    }
}