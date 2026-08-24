namespace OrderManagement.Application.DTOs.Pedidos
{
    public class CriarPedidoRequest
    {
        public List<ItemPedidoRequest> Itens { get; set; } =
            new List<ItemPedidoRequest>();
    }
}