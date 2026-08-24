using OrderManagement.Domain.Enums;

namespace OrderManagement.Application.DTOs.Pedidos
{
    public class AtualizarStatusPedidoRequest
    {
        public StatusPedido Status { get; set; }
    }
}