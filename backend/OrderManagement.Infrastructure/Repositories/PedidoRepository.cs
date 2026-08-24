using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using OrderManagement.Application.Interfaces;
using OrderManagement.Domain.Entities;
using OrderManagement.Domain.Enums;
using OrderManagement.Infrastructure.Context;

namespace OrderManagement.Infrastructure.Repositories
{
    public class PedidoRepository : IPedidoRepository
    {
        private readonly ApplicationDbContext _context;

        public PedidoRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<(List<Pedido> Itens, int TotalItens)> ListarAsync(
            StatusPedido? status,
            DateTime? dataInicial,
            DateTime? dataFinal,
            decimal? valorMinimo,
            decimal? valorMaximo,
            int skip,
            int take)
                {
            var query = _context.Pedidos
                .AsNoTracking()
                .AsQueryable();

            if (status.HasValue)
            {
                query = query.Where(
                    x => x.Status == status.Value);
            }

            if (dataInicial.HasValue)
            {
                query = query.Where(
                    x => x.DataCriacao >= dataInicial.Value);
            }

            if (dataFinal.HasValue)
            {
                query = query.Where(
                    x => x.DataCriacao < dataFinal.Value);
            }

            if (valorMinimo.HasValue)
            {
                query = query.Where(
                    x => x.ValorTotal >= valorMinimo.Value);
            }

            if (valorMaximo.HasValue)
            {
                query = query.Where(
                    x => x.ValorTotal <= valorMaximo.Value);
            }

            var totalItens = await query.CountAsync();

            var itens = await query
                .OrderByDescending(x => x.DataCriacao)
                .ThenByDescending(x => x.Id)
                .Skip(skip)
                .Take(take)
                .ToListAsync();

            return (itens, totalItens);
        }

        public async Task<Pedido?> ObterPorIdAsync(long id)
        {
            return await _context.Pedidos
                .Include(x => x.Itens)
                .ThenInclude(x => x.Produto)
                .FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<Idempotencia?> ObterIdempotenciaAsync(
            string chave)
        {
            return await _context.Idempotencias
                .FirstOrDefaultAsync(x => x.Chave == chave);
        }

        public async Task<List<Produto>> ObterProdutosAsync(
            IEnumerable<long> ids)
        {
            return await _context.Produtos
                .Where(x => ids.Contains(x.Id))
                .ToListAsync();
        }

        public async Task AdicionarAsync(Pedido pedido)
        {
            await _context.Pedidos.AddAsync(pedido);
        }

        public async Task AdicionarIdempotenciaAsync(
            Idempotencia idempotencia)
        {
            await _context.Idempotencias.AddAsync(idempotencia);
        }

        public async Task SalvarAlteracoesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task<IDbContextTransaction> IniciarTransacaoAsync()
        {
            return await _context.Database.BeginTransactionAsync();
        }

        public async Task<bool> AtualizarStatusCondicionalAsync(
            long pedidoId,
            StatusPedido statusAtual,
            StatusPedido novoStatus,
            DateTime dataAtualizacao)
        {
            var linhasAfetadas = await _context.Pedidos
                .Where(x =>
                    x.Id == pedidoId &&
                    x.Status == statusAtual)
                .ExecuteUpdateAsync(x => x
                    .SetProperty(
                        p => p.Status,
                        novoStatus)
                    .SetProperty(
                        p => p.DataAtualizacao,
                        dataAtualizacao));

            return linhasAfetadas == 1;
        }


        public async Task<bool> ReservarEstoqueAsync(
            long produtoId,
            int quantidade)
        {
            var linhasAfetadas =
                await _context.Database.ExecuteSqlInterpolatedAsync($@"
                    UPDATE Produtos
                    SET QuantidadeEstoque =
                        QuantidadeEstoque - {quantidade}
                    WHERE Id = {produtoId}
                      AND QuantidadeEstoque >= {quantidade}");

            return linhasAfetadas == 1;
        }

        public async Task DevolverEstoqueAsync(
            long produtoId,
            int quantidade)
        {
            await _context.Database.ExecuteSqlInterpolatedAsync($@"
                UPDATE Produtos
                SET QuantidadeEstoque =
                    QuantidadeEstoque + {quantidade}
                WHERE Id = {produtoId}");
        }
    }
}