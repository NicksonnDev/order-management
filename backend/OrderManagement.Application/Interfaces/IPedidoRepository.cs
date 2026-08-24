using Microsoft.EntityFrameworkCore.Storage;
using OrderManagement.Domain.Entities;
using OrderManagement.Domain.Enums;

namespace OrderManagement.Application.Interfaces
{
    public interface IPedidoRepository
    {
        Task<(List<Pedido> Itens, int TotalItens)> ListarAsync(
            StatusPedido? status,
            DateTime? dataInicial,
            DateTime? dataFinal,
            decimal? valorMinimo,
            decimal? valorMaximo,
            int skip,
            int take);

        Task<Pedido?> ObterPorIdAsync(long id);


        Task<Idempotencia?> ObterIdempotenciaAsync(
            string chave);

        Task<List<Produto>> ObterProdutosAsync(
            IEnumerable<long> ids);

        Task<bool> ReservarEstoqueAsync(
            long produtoId,
            int quantidade);

        Task DevolverEstoqueAsync(
            long produtoId,
            int quantidade);

        Task AdicionarAsync(Pedido pedido);

        Task AdicionarIdempotenciaAsync(
            Idempotencia idempotencia);

        Task<IDbContextTransaction> IniciarTransacaoAsync();

        Task<bool> AtualizarStatusCondicionalAsync(
            long pedidoId,
            StatusPedido statusAtual,
            StatusPedido novoStatus,
            DateTime dataAtualizacao);

        Task SalvarAlteracoesAsync();
    }
}