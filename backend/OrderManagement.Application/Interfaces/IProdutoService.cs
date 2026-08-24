using OrderManagement.Application.DTOs.Common;
using OrderManagement.Application.DTOs.Produtos;

namespace OrderManagement.Application.Interfaces
{
    public interface IProdutoService
    {
        Task<ResultadoPaginado<ProdutoResponse>> ListarAsync(
            ListarProdutosRequest request);

        Task<ProdutoResponse?> ObterPorIdAsync(long id);

        Task<ProdutoResponse> CriarAsync(
            CriarProdutoRequest request);

        Task<ProdutoResponse?> AtualizarAsync(
            long id,
            AtualizarProdutoRequest request);
    }
}