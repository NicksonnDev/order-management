using Moq;
using OrderManagement.Application.DTOs.Produtos;
using OrderManagement.Application.Interfaces;
using OrderManagement.Application.Services;
using OrderManagement.Domain.Entities;
using OrderManagement.Domain.Enums;

namespace OrderManagement.Tests.UnitTests.Services
{
    public class ProdutoServiceTests
    {
        private readonly Mock<IProdutoRepository> _produtoRepositoryMock;
        private readonly ProdutoService _produtoService;

        public ProdutoServiceTests()
        {
            _produtoRepositoryMock = new Mock<IProdutoRepository>();

            _produtoService = new ProdutoService(
                _produtoRepositoryMock.Object);
        }

        [Fact]
        public async Task CriarProduto_NomeVazio_DeveLancarArgumentException()
        {
            var request = new CriarProdutoRequest
            {
                Nome = "",
                Descricao = "Produto teste",
                Preco = 100,
                QuantidadeEstoque = 10
            };

            var exception =
                await Assert.ThrowsAsync<ArgumentException>(
                    () => _produtoService.CriarAsync(request));

            Assert.Equal(
                "O nome do produto é obrigatório.",
                exception.Message);

            _produtoRepositoryMock.Verify(
                x => x.AdicionarAsync(
                    It.IsAny<Produto>()),
                Times.Never);
        }

        [Fact]
        public async Task CriarProduto_PrecoZero_DeveLancarArgumentException()
        {
            var request = new CriarProdutoRequest
            {
                Nome = "Produto Teste",
                Descricao = "Produto teste",
                Preco = 0,
                QuantidadeEstoque = 10
            };

            var exception =
                await Assert.ThrowsAsync<ArgumentException>(
                    () => _produtoService.CriarAsync(request));

            Assert.Equal(
                "O preço do produto deve ser maior que zero.",
                exception.Message);

            _produtoRepositoryMock.Verify(
                x => x.AdicionarAsync(
                    It.IsAny<Produto>()),
                Times.Never);
        }

        [Fact]
        public async Task CriarProduto_EstoqueNegativo_DeveLancarArgumentException()
        {
            var request = new CriarProdutoRequest
            {
                Nome = "Produto Teste",
                Descricao = "Produto teste",
                Preco = 100,
                QuantidadeEstoque = -1
            };

            var exception =
                await Assert.ThrowsAsync<ArgumentException>(
                    () => _produtoService.CriarAsync(request));

            Assert.Equal(
                "A quantidade em estoque não pode ser negativa.",
                exception.Message);

            _produtoRepositoryMock.Verify(
                x => x.AdicionarAsync(
                    It.IsAny<Produto>()),
                Times.Never);
        }

        [Fact]
        public async Task CriarProduto_Valido_DeveCriarProdutoAtivo()
        {
            var request = new CriarProdutoRequest
            {
                Nome = "Notebook",
                Descricao = "Notebook para testes",
                Preco = 3500,
                QuantidadeEstoque = 5
            };

            _produtoRepositoryMock
                .Setup(x => x.AdicionarAsync(
                    It.IsAny<Produto>()))
                .Callback<Produto>(produto =>
                {
                    produto.Id = 1;
                })
                .Returns(Task.CompletedTask);

            _produtoRepositoryMock
                .Setup(x => x.SalvarAlteracoesAsync())
                .Returns(Task.CompletedTask);

            var resultado =
                await _produtoService.CriarAsync(request);

            Assert.Equal(1, resultado.Id);
            Assert.Equal("Notebook", resultado.Nome);
            Assert.Equal(3500, resultado.Preco);
            Assert.Equal(5, resultado.QuantidadeEstoque);
            Assert.Equal(StatusProduto.Ativo, resultado.Status);

            _produtoRepositoryMock.Verify(
                x => x.AdicionarAsync(
                    It.IsAny<Produto>()),
                Times.Once);

            _produtoRepositoryMock.Verify(
                x => x.SalvarAlteracoesAsync(),
                Times.Once);
        }

        [Fact]
        public async Task ListarProdutos_TamanhoPaginaMaiorQue50_DeveLancarArgumentException()
        {
            var request = new ListarProdutosRequest
            {
                Pagina = 1,
                TamanhoPagina = 51
            };

            var exception =
                await Assert.ThrowsAsync<ArgumentException>(
                    () => _produtoService.ListarAsync(request));

            Assert.Equal(
                "O tamanho da página deve estar entre 1 e 50.",
                exception.Message);

            _produtoRepositoryMock.Verify(
                x => x.ListarAsync(
                    It.IsAny<string?>(),
                    It.IsAny<StatusProduto?>(),
                    It.IsAny<string>(),
                    It.IsAny<bool>(),
                    It.IsAny<int>(),
                    It.IsAny<int>()),
                Times.Never);
        }

        [Fact]
        public async Task ListarProdutos_StatusInvalido_DeveLancarArgumentException()
        {
            var request = new ListarProdutosRequest
            {
                Pagina = 1,
                TamanhoPagina = 50,
                Status = (StatusProduto)99
            };

            var exception =
                await Assert.ThrowsAsync<ArgumentException>(
                    () => _produtoService.ListarAsync(request));

            Assert.Equal(
                "O status informado é inválido.",
                exception.Message);

            _produtoRepositoryMock.Verify(
                x => x.ListarAsync(
                    It.IsAny<string?>(),
                    It.IsAny<StatusProduto?>(),
                    It.IsAny<string>(),
                    It.IsAny<bool>(),
                    It.IsAny<int>(),
                    It.IsAny<int>()),
                Times.Never);
        }

        [Fact]
        public async Task ListarProdutos_Valido_DeveRetornarResultadoPaginado()
        {
            var produtos = new List<Produto>
    {
        new Produto
        {
            Id = 3,
            Nome = "Mouse",
            Descricao = "Mouse sem fio",
            Preco = 150,
            QuantidadeEstoque = 10,
            Status = StatusProduto.Ativo,
            DataCriacao = DateTime.UtcNow
        },
        new Produto
        {
            Id = 4,
            Nome = "Teclado",
            Descricao = "Teclado mecânico",
            Preco = 300,
            QuantidadeEstoque = 5,
            Status = StatusProduto.Ativo,
            DataCriacao = DateTime.UtcNow
        }
    };

            _produtoRepositoryMock
                .Setup(x => x.ListarAsync(
                    null,
                    null,
                    "nome",
                    false,
                    2,
                    2))
                .ReturnsAsync(
                    (produtos, 5));

            var request = new ListarProdutosRequest
            {
                Pagina = 2,
                TamanhoPagina = 2,
                OrdenarPor = "nome",
                Direcao = "asc"
            };

            var resultado =
                await _produtoService.ListarAsync(request);

            Assert.Equal(2, resultado.Pagina);
            Assert.Equal(2, resultado.TamanhoPagina);
            Assert.Equal(5, resultado.TotalItens);
            Assert.Equal(3, resultado.TotalPaginas);
            Assert.Equal(2, resultado.Itens.Count);

            _produtoRepositoryMock.Verify(
                x => x.ListarAsync(
                    null,
                    null,
                    "nome",
                    false,
                    2,
                    2),
                Times.Once);
        }


        [Fact]
        public async Task AtualizarProduto_Valido_DeveAtualizarDadosSemAlterarEstoque()
        {
            var produto = new Produto
            {
                Id = 1,
                Nome = "Mouse",
                Descricao = "Mouse antigo",
                Preco = 100,
                QuantidadeEstoque = 10,
                Status = StatusProduto.Ativo,
                DataCriacao = DateTime.UtcNow
            };

            var request = new AtualizarProdutoRequest
            {
                Nome = "Mouse Gamer",
                Descricao = "Mouse atualizado",
                Preco = 250,
                Status = StatusProduto.Inativo
            };

            _produtoRepositoryMock
                .Setup(x => x.ObterPorIdAsync(1))
                .ReturnsAsync(produto);

            _produtoRepositoryMock
                .Setup(x => x.AtualizarAsync(
                    It.IsAny<Produto>()))
                .Returns(Task.CompletedTask);

            _produtoRepositoryMock
                .Setup(x => x.SalvarAlteracoesAsync())
                .Returns(Task.CompletedTask);

            var resultado =
                await _produtoService.AtualizarAsync(
                    1,
                    request);

            Assert.NotNull(resultado);

            Assert.Equal(
                "Mouse Gamer",
                resultado.Nome);

            Assert.Equal(
                "Mouse atualizado",
                resultado.Descricao);

            Assert.Equal(
                250,
                resultado.Preco);

            Assert.Equal(
                StatusProduto.Inativo,
                resultado.Status);

            Assert.Equal(
                10,
                resultado.QuantidadeEstoque);

            _produtoRepositoryMock.Verify(
                x => x.AtualizarAsync(
                    It.Is<Produto>(
                        p =>
                            p.Id == 1 &&
                            p.Nome == "Mouse Gamer" &&
                            p.Preco == 250 &&
                            p.Status == StatusProduto.Inativo &&
                            p.QuantidadeEstoque == 10)),
                Times.Once);

            _produtoRepositoryMock.Verify(
                x => x.SalvarAlteracoesAsync(),
                Times.Once);
        }
    }
}