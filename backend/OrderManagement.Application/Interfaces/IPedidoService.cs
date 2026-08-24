using OrderManagement.Application.DTOs.Pedidos;
using OrderManagement.Application.DTOs.Common;

namespace OrderManagement.Application.Interfaces
{
    public interface IPedidoService
    {
        Task<ResultadoPaginado<PedidoResumoResponse>> ListarAsync(
            ListarPedidosRequest request);

        Task<PedidoResponse?> ObterPorIdAsync(long id);

        Task<PedidoResponse> CriarAsync(
            CriarPedidoRequest request,
            string chaveIdempotencia);

        Task<PedidoResponse?> AtualizarStatusAsync(
            long id,
            AtualizarStatusPedidoRequest request);
    }
}