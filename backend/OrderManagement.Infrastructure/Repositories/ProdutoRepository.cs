using Microsoft.EntityFrameworkCore;
using OrderManagement.Application.Interfaces;
using OrderManagement.Domain.Entities;
using OrderManagement.Domain.Enums;
using OrderManagement.Infrastructure.Context;

namespace OrderManagement.Infrastructure.Repositories
{
    public class ProdutoRepository : IProdutoRepository
    {
        private readonly ApplicationDbContext _context;

        public ProdutoRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<(List<Produto> Itens, int TotalItens)> ListarAsync(
            string? nome,
            StatusProduto? status,
            string ordenarPor,
            bool descendente,
            int skip,
            int take)
        {
            var query = _context.Produtos
                .AsNoTracking()
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(nome))
            {
                nome = nome.Trim();

                query = query.Where(
                    x => EF.Functions.Like(
                        x.Nome,
                        $"%{nome}%"));
            }

            if (status.HasValue)
            {
                query = query.Where(
                    x => x.Status == status.Value);
            }

            query = (ordenarPor, descendente) switch
            {
                ("nome", false) =>
                    query.OrderBy(x => x.Nome),

                ("nome", true) =>
                    query.OrderByDescending(x => x.Nome),

                ("preco", false) =>
                    query.OrderBy(x => x.Preco),

                ("preco", true) =>
                    query.OrderByDescending(x => x.Preco),

                ("estoque", false) =>
                    query.OrderBy(x => x.QuantidadeEstoque),

                ("estoque", true) =>
                    query.OrderByDescending(x => x.QuantidadeEstoque),

                ("status", false) =>
                    query.OrderBy(x => x.Status),

                ("status", true) =>
                    query.OrderByDescending(x => x.Status),

                ("datacriacao", false) =>
                    query.OrderBy(x => x.DataCriacao),

                ("datacriacao", true) =>
                    query.OrderByDescending(x => x.DataCriacao),

                _ =>
                    query.OrderBy(x => x.Nome)
            };

            var totalItens = await query.CountAsync();

            var itens = await query
                .Skip(skip)
                .Take(take)
                .ToListAsync();

            return (itens, totalItens);
        }

        public async Task<Produto?> ObterPorIdAsync(long id)
        {
            return await _context.Produtos
                .FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task AdicionarAsync(Produto produto)
        {
            await _context.Produtos.AddAsync(produto);
        }

        public Task AtualizarAsync(Produto produto)
        {
            _context.Produtos.Update(produto);

            return Task.CompletedTask;
        }

        public async Task SalvarAlteracoesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}