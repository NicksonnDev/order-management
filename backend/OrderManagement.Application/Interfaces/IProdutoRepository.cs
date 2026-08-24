using OrderManagement.Domain.Entities;
using OrderManagement.Domain.Enums;

namespace OrderManagement.Application.Interfaces
{
    public interface IProdutoRepository
    {
        Task<(List<Produto> Itens, int TotalItens)> ListarAsync(
        string? nome,
        StatusProduto? status,
        string ordenarPor,
        bool descendente,
        int skip,
        int take);

        Task<Produto?> ObterPorIdAsync(long id);

        Task AdicionarAsync(Produto produto);

        Task AtualizarAsync(Produto produto);

        Task SalvarAlteracoesAsync();
    }
}