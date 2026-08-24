using OrderManagement.Application.DTOs.Common;
using OrderManagement.Application.DTOs.Produtos;
using OrderManagement.Application.Interfaces;
using OrderManagement.Domain.Entities;
using OrderManagement.Domain.Enums;

namespace OrderManagement.Application.Services
{
    public class ProdutoService : IProdutoService
    {
        private readonly IProdutoRepository _produtoRepository;

        public ProdutoService(IProdutoRepository produtoRepository)
        {
            _produtoRepository = produtoRepository;
        }

        public async Task<ResultadoPaginado<ProdutoResponse>> ListarAsync(
            ListarProdutosRequest request)
        {
            if (request.Pagina <= 0)
            {
                throw new ArgumentException(
                    "A página deve ser maior que zero.");
            }

            if (request.TamanhoPagina <= 0 ||
                request.TamanhoPagina > 50)
            {
                throw new ArgumentException(
                    "O tamanho da página deve estar entre 1 e 50.");
            }

            if (request.Status.HasValue &&
                !Enum.IsDefined(typeof(StatusProduto), request.Status.Value))
            {
                throw new ArgumentException(
                    "O status informado é inválido.");
            }


            var ordenarPor =
                request.OrdenarPor?
                    .Trim()
                    .ToLowerInvariant()
                ?? "nome";

            var camposOrdenacao = new[]
            {
        "nome",
        "preco",
        "estoque",
        "status",
        "datacriacao"
    };

            if (!camposOrdenacao.Contains(ordenarPor))
            {
                throw new ArgumentException(
                    "Campo de ordenação inválido.");
            }

            var direcao =
                request.Direcao?
                    .Trim()
                    .ToLowerInvariant()
                ?? "asc";

            if (direcao != "asc" &&
                direcao != "desc")
            {
                throw new ArgumentException(
                    "A direção deve ser asc ou desc.");
            }

            var skip =
                (request.Pagina - 1) *
                request.TamanhoPagina;

            var resultado =
                await _produtoRepository.ListarAsync(
                    request.Nome,
                    request.Status,
                    ordenarPor,
                    direcao == "desc",
                    skip,
                    request.TamanhoPagina);

            return new ResultadoPaginado<ProdutoResponse>
            {
                Itens = resultado.Itens
                    .Select(MapearParaResponse)
                    .ToList(),

                Pagina = request.Pagina,

                TamanhoPagina =
                    request.TamanhoPagina,

                TotalItens =
                    resultado.TotalItens,

                TotalPaginas =
                    (int)Math.Ceiling(
                        resultado.TotalItens /
                        (double)request.TamanhoPagina)
            };
        }

        public async Task<ProdutoResponse?> ObterPorIdAsync(long id)
        {
            var produto = await _produtoRepository.ObterPorIdAsync(id);

            if (produto == null)
            {
                return null;
            }

            return MapearParaResponse(produto);
        }

        public async Task<ProdutoResponse> CriarAsync(
            CriarProdutoRequest request)
        {
            ValidarProduto(request);

            var produto = new Produto
            {
                Nome = request.Nome.Trim(),
                Descricao = request.Descricao?.Trim() ?? string.Empty,
                Preco = request.Preco,
                QuantidadeEstoque = request.QuantidadeEstoque,
                Status = StatusProduto.Ativo,
                DataCriacao = DateTime.UtcNow
            };

            await _produtoRepository.AdicionarAsync(produto);

            await _produtoRepository.SalvarAlteracoesAsync();

            return MapearParaResponse(produto);
        }

        public async Task<ProdutoResponse?> AtualizarAsync(
            long id,
            AtualizarProdutoRequest request)
        {
            var produto = await _produtoRepository.ObterPorIdAsync(id);

            if (produto == null)
            {
                return null;
            }

            ValidarAtualizacao(request);

            produto.Nome = request.Nome.Trim();
            produto.Descricao = request.Descricao?.Trim() ?? string.Empty;
            produto.Preco = request.Preco;
            produto.Status = request.Status;

            await _produtoRepository.AtualizarAsync(produto);

            await _produtoRepository.SalvarAlteracoesAsync();

            return MapearParaResponse(produto);
        }

        private static void ValidarProduto(CriarProdutoRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Nome))
            {
                throw new ArgumentException(
                    "O nome do produto é obrigatório.");
            }

            if (request.Preco <= 0)
            {
                throw new ArgumentException(
                    "O preço do produto deve ser maior que zero.");
            }

            if (request.QuantidadeEstoque < 0)
            {
                throw new ArgumentException(
                    "A quantidade em estoque não pode ser negativa.");
            }

            if (request.Nome.Trim().Length > 200)
            {
                throw new ArgumentException(
                    "O nome do produto deve possuir no máximo 200 caracteres.");
            }

            if ((request.Descricao?.Trim().Length ?? 0) > 1000)
            {
                throw new ArgumentException(
                    "A descrição do produto deve possuir no máximo 1000 caracteres.");
            }
        }

        private static void ValidarAtualizacao(
     AtualizarProdutoRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Nome))
            {
                throw new ArgumentException(
                    "O nome do produto é obrigatório.");
            }

            if (request.Nome.Trim().Length > 200)
            {
                throw new ArgumentException(
                    "O nome do produto deve possuir no máximo 200 caracteres.");
            }

            if ((request.Descricao?.Trim().Length ?? 0) > 1000)
            {
                throw new ArgumentException(
                    "A descrição do produto deve possuir no máximo 1000 caracteres.");
            }

            if (request.Preco <= 0)
            {
                throw new ArgumentException(
                    "O preço do produto deve ser maior que zero.");
            }

            if (!Enum.IsDefined(typeof(StatusProduto), request.Status))
            {
                throw new ArgumentException(
                    "O status do produto é inválido.");
            }
        }

        private static ProdutoResponse MapearParaResponse(Produto produto)
        {
            return new ProdutoResponse
            {
                Id = produto.Id,
                Nome = produto.Nome,
                Descricao = produto.Descricao,
                Preco = produto.Preco,
                QuantidadeEstoque = produto.QuantidadeEstoque,
                Status = produto.Status,
                DataCriacao = produto.DataCriacao
            };
        }
    }
}