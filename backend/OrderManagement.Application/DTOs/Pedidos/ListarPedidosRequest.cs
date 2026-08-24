using OrderManagement.Domain.Enums;

namespace OrderManagement.Application.DTOs.Pedidos
{
    public class ListarPedidosRequest
    {
        public int Pagina { get; set; } = 1;

        public int TamanhoPagina { get; set; } = 50;

        public StatusPedido? Status { get; set; }

        public DateTime? DataInicial { get; set; }

        public DateTime? DataFinal { get; set; }

        public decimal? ValorMinimo { get; set; }

        public decimal? ValorMaximo { get; set; }
    }
}