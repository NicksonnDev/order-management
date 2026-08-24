using Moq;
using OrderManagement.Application.DTOs.Pedidos;
using OrderManagement.Application.Interfaces;
using OrderManagement.Application.Services;
using OrderManagement.Domain.Entities;
using OrderManagement.Domain.Enums;
using Microsoft.EntityFrameworkCore.Storage;
using System.Security.Cryptography;
using System.Text;

namespace OrderManagement.Tests.UnitTests.Services
{
    public class PedidoServiceTests
    {

        private static string GerarHashRequisicaoTeste(
            CriarPedidoRequest request)
        {
            var conteudo = string.Join(
                "|",
                request.Itens
                    .OrderBy(x => x.ProdutoId)
                    .ThenBy(x => x.Quantidade)
                    .Select(x => $"{x.ProdutoId}:{x.Quantidade}"));

            var bytes =
                Encoding.UTF8.GetBytes(conteudo);

            var hash =
                SHA256.HashData(bytes);

            return Convert.ToHexString(hash);
        }

        private Mock<IDbContextTransaction> ConfigurarCriacaoPedido(
            Produto produto)
        {
            var transacaoMock =
                new Mock<IDbContextTransaction>();

            _pedidoRepositoryMock
                .Setup(x => x.ObterIdempotenciaAsync(
                    It.IsAny<string>()))
                .ReturnsAsync((Idempotencia?)null);

            _pedidoRepositoryMock
                .Setup(x => x.ObterProdutosAsync(
                    It.IsAny<IEnumerable<long>>()))
                .ReturnsAsync([produto]);

            _pedidoRepositoryMock
                .Setup(x => x.IniciarTransacaoAsync())
                .ReturnsAsync(transacaoMock.Object);

            _pedidoRepositoryMock
                .Setup(x => x.ReservarEstoqueAsync(
                    produto.Id,
                    It.IsAny<int>()))
                .ReturnsAsync(true);

            _pedidoRepositoryMock
                .Setup(x => x.AdicionarAsync(
                    It.IsAny<Pedido>()))
                .Callback<Pedido>(pedido =>
                {
                    pedido.Id = 1;
                })
                .Returns(Task.CompletedTask);

            _pedidoRepositoryMock
                .Setup(x => x.AdicionarIdempotenciaAsync(
                    It.IsAny<Idempotencia>()))
                .Returns(Task.CompletedTask);

            _pedidoRepositoryMock
                .Setup(x => x.SalvarAlteracoesAsync())
                .Returns(Task.CompletedTask);

            return transacaoMock;
        }

        private Mock<IDbContextTransaction> ConfigurarAtualizacaoStatus(
            Pedido pedido,
            bool statusAtualizado = true)
        {
            var transacaoMock =
                new Mock<IDbContextTransaction>();

            _pedidoRepositoryMock
                .Setup(x => x.ObterPorIdAsync(
                    pedido.Id))
                .ReturnsAsync(pedido);

            _pedidoRepositoryMock
                .Setup(x => x.IniciarTransacaoAsync())
                .ReturnsAsync(transacaoMock.Object);

            _pedidoRepositoryMock
                .Setup(x => x.AtualizarStatusCondicionalAsync(
                    pedido.Id,
                    pedido.Status,
                    It.IsAny<StatusPedido>(),
                    It.IsAny<DateTime>()))
                .ReturnsAsync(statusAtualizado);

            transacaoMock
                .Setup(x => x.CommitAsync(
                    It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            transacaoMock
                .Setup(x => x.RollbackAsync(
                    It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            transacaoMock
                .Setup(x => x.DisposeAsync())
                .Returns(ValueTask.CompletedTask);

            return transacaoMock;
        }

        private readonly Mock<IPedidoRepository> _pedidoRepositoryMock;
        private readonly PedidoService _pedidoService;

        public PedidoServiceTests()
        {
            _pedidoRepositoryMock = new Mock<IPedidoRepository>();

            _pedidoService = new PedidoService(
                _pedidoRepositoryMock.Object);
        }


        [Theory]
        [InlineData(StatusPedido.Pendente)]
        [InlineData(StatusPedido.Processando)]
        public async Task AtualizarStatus_ParaCancelado_DeveDevolverEstoque(
    StatusPedido statusAtual)
        {
            var produto = new Produto
            {
                Id = 10,
                Nome = "Mouse",
                Descricao = "Mouse teste",
                Preco = 100,
                QuantidadeEstoque = 10,
                Status = StatusProduto.Ativo,
                DataCriacao = DateTime.UtcNow
            };

            var pedido = new Pedido
            {
                Id = 1,
                Status = statusAtual,
                DataCriacao = DateTime.UtcNow,
                DataAtualizacao = DateTime.UtcNow,
                ValorProdutos = 200,
                Desconto = 0,
                ValorTotal = 200
            };

            pedido.Itens.Add(
                new ItemPedido
                {
                    Id = 1,
                    PedidoId = pedido.Id,
                    ProdutoId = produto.Id,
                    Produto = produto,
                    Quantidade = 2,
                    PrecoUnitario = 100,
                    ValorTotal = 200
                });

            var transacaoMock =
                ConfigurarAtualizacaoStatus(
                    pedido);

            _pedidoRepositoryMock
                .Setup(x => x.DevolverEstoqueAsync(
                    produto.Id,
                    2))
                .Returns(Task.CompletedTask);

            var request =
                new AtualizarStatusPedidoRequest
                {
                    Status =
                        StatusPedido.Cancelado
                };

            var resultado =
                await _pedidoService.AtualizarStatusAsync(
                    pedido.Id,
                    request);

            Assert.NotNull(resultado);

            Assert.Equal(
                StatusPedido.Cancelado,
                resultado.Status);

            _pedidoRepositoryMock.Verify(
                x => x.AtualizarStatusCondicionalAsync(
                    pedido.Id,
                    statusAtual,
                    StatusPedido.Cancelado,
                    It.IsAny<DateTime>()),
                Times.Once);

            _pedidoRepositoryMock.Verify(
                x => x.DevolverEstoqueAsync(
                    produto.Id,
                    2),
                Times.Once);

            transacaoMock.Verify(
                x => x.CommitAsync(
                    It.IsAny<CancellationToken>()),
                Times.Once);
        }

        [Theory]
        [InlineData(
    StatusPedido.Pendente,
    StatusPedido.Concluido)]
        [InlineData(
    StatusPedido.Concluido,
    StatusPedido.Pendente)]
        [InlineData(
    StatusPedido.Concluido,
    StatusPedido.Cancelado)]
        [InlineData(
    StatusPedido.Cancelado,
    StatusPedido.Processando)]
        public async Task AtualizarStatus_TransicaoInvalida_DeveLancarInvalidOperationException(
    StatusPedido statusAtual,
    StatusPedido novoStatus)
        {
            var pedido = new Pedido
            {
                Id = 1,
                Status = statusAtual,
                DataCriacao = DateTime.UtcNow,
                DataAtualizacao = DateTime.UtcNow
            };

            _pedidoRepositoryMock
                .Setup(x => x.ObterPorIdAsync(
                    pedido.Id))
                .ReturnsAsync(pedido);

            var request =
                new AtualizarStatusPedidoRequest
                {
                    Status = novoStatus
                };

            var exception =
                await Assert.ThrowsAsync<InvalidOperationException>(
                    () => _pedidoService.AtualizarStatusAsync(
                        pedido.Id,
                        request));

            Assert.Equal(
                $"Não é possível alterar o pedido de {statusAtual} para {novoStatus}.",
                exception.Message);

            _pedidoRepositoryMock.Verify(
                x => x.IniciarTransacaoAsync(),
                Times.Never);

            _pedidoRepositoryMock.Verify(
                x => x.AtualizarStatusCondicionalAsync(
                    It.IsAny<long>(),
                    It.IsAny<StatusPedido>(),
                    It.IsAny<StatusPedido>(),
                    It.IsAny<DateTime>()),
                Times.Never);
        }

        [Theory]
        [InlineData(
            StatusPedido.Pendente,
            StatusPedido.Processando)]
            [InlineData(
            StatusPedido.Processando,
            StatusPedido.Concluido)]
        public async Task AtualizarStatus_TransicaoValida_DeveAtualizarPedido(
            StatusPedido statusAtual,
            StatusPedido novoStatus)
        {
            var pedido = new Pedido
            {
                Id = 1,
                Status = statusAtual,
                DataCriacao = DateTime.UtcNow,
                DataAtualizacao = DateTime.UtcNow,
                ValorProdutos = 100,
                Desconto = 0,
                ValorTotal = 100
            };

            var transacaoMock =
                ConfigurarAtualizacaoStatus(
                    pedido);

            var request =
                new AtualizarStatusPedidoRequest
                {
                    Status = novoStatus
                };

            var resultado =
                await _pedidoService.AtualizarStatusAsync(
                    pedido.Id,
                    request);

            Assert.NotNull(resultado);

            Assert.Equal(
                novoStatus,
                resultado.Status);

            _pedidoRepositoryMock.Verify(
                x => x.AtualizarStatusCondicionalAsync(
                    pedido.Id,
                    statusAtual,
                    novoStatus,
                    It.IsAny<DateTime>()),
                Times.Once);

            transacaoMock.Verify(
                x => x.CommitAsync(
                    It.IsAny<CancellationToken>()),
                Times.Once);

            transacaoMock.Verify(
                x => x.RollbackAsync(
                    It.IsAny<CancellationToken>()),
                Times.Never);
        }

        [Fact]
        public async Task CriarPedido_MesmaChaveEMesmaRequisicao_DeveRetornarPedidoExistente()
        {
            var request = new CriarPedidoRequest
            {
                Itens =
                [
                    new()
            {
                ProdutoId = 1,
                Quantidade = 2
            }
                ]
            };

            var hash =
                GerarHashRequisicaoTeste(
                    request);

            var pedidoExistente = new Pedido
            {
                Id = 10,
                DataCriacao = DateTime.UtcNow,
                DataAtualizacao = DateTime.UtcNow,
                Status = StatusPedido.Pendente,
                ValorProdutos = 200,
                Desconto = 0,
                ValorTotal = 200
            };

            var idempotencia = new Idempotencia
            {
                Id = 1,
                Chave = "chave-pedido-1",
                HashRequisicao = hash,
                PedidoId = pedidoExistente.Id,
                Pedido = pedidoExistente,
                DataCriacao = DateTime.UtcNow,
                Resposta = string.Empty
            };

            _pedidoRepositoryMock
                .Setup(x => x.ObterIdempotenciaAsync(
                    "chave-pedido-1"))
                .ReturnsAsync(idempotencia);

            _pedidoRepositoryMock
                .Setup(x => x.ObterPorIdAsync(
                    pedidoExistente.Id))
                .ReturnsAsync(pedidoExistente);

            var resultado =
                await _pedidoService.CriarAsync(
                    request,
                    "chave-pedido-1");

            Assert.NotNull(resultado);

            Assert.Equal(
                pedidoExistente.Id,
                resultado.Id);

            Assert.Equal(
                200,
                resultado.ValorTotal);

            _pedidoRepositoryMock.Verify(
                x => x.ObterIdempotenciaAsync(
                    "chave-pedido-1"),
                Times.Once);

            _pedidoRepositoryMock.Verify(
                x => x.ObterPorIdAsync(
                    pedidoExistente.Id),
                Times.Once);

            _pedidoRepositoryMock.Verify(
                x => x.ObterProdutosAsync(
                    It.IsAny<IEnumerable<long>>()),
                Times.Never);

            _pedidoRepositoryMock.Verify(
                x => x.IniciarTransacaoAsync(),
                Times.Never);

            _pedidoRepositoryMock.Verify(
                x => x.AdicionarAsync(
                    It.IsAny<Pedido>()),
                Times.Never);

            _pedidoRepositoryMock.Verify(
                x => x.ReservarEstoqueAsync(
                    It.IsAny<long>(),
                    It.IsAny<int>()),
                Times.Never);
        }

        [Fact]
        public async Task CriarPedido_MesmaChaveERequisicaoDiferente_DeveLancarInvalidOperationException()
        {
            var requestOriginal = new CriarPedidoRequest
            {
                Itens =
                [
                    new()
            {
                ProdutoId = 1,
                Quantidade = 2
            }
                ]
            };

            var requestNova = new CriarPedidoRequest
            {
                Itens =
                [
                    new()
            {
                ProdutoId = 1,
                Quantidade = 3
            }
                ]
            };

            var hashOriginal =
                GerarHashRequisicaoTeste(
                    requestOriginal);

            var idempotencia = new Idempotencia
            {
                Id = 1,
                Chave = "chave-pedido-1",
                HashRequisicao = hashOriginal,
                PedidoId = 10,
                DataCriacao = DateTime.UtcNow,
                Resposta = string.Empty
            };

            _pedidoRepositoryMock
                .Setup(x => x.ObterIdempotenciaAsync(
                    "chave-pedido-1"))
                .ReturnsAsync(idempotencia);

            var exception =
                await Assert.ThrowsAsync<InvalidOperationException>(
                    () => _pedidoService.CriarAsync(
                        requestNova,
                        "chave-pedido-1"));

            Assert.Equal(
                "A chave de idempotência já foi utilizada com outra requisição.",
                exception.Message);

            _pedidoRepositoryMock.Verify(
                x => x.ObterPorIdAsync(
                    It.IsAny<long>()),
                Times.Never);

            _pedidoRepositoryMock.Verify(
                x => x.ObterProdutosAsync(
                    It.IsAny<IEnumerable<long>>()),
                Times.Never);

            _pedidoRepositoryMock.Verify(
                x => x.IniciarTransacaoAsync(),
                Times.Never);

            _pedidoRepositoryMock.Verify(
                x => x.AdicionarAsync(
                    It.IsAny<Pedido>()),
                Times.Never);

            _pedidoRepositoryMock.Verify(
                x => x.ReservarEstoqueAsync(
                    It.IsAny<long>(),
                    It.IsAny<int>()),
                Times.Never);
        }

        [Fact]
        public async Task CriarPedido_EstoqueConsumidoPorOutraOperacao_DeveFazerRollback()
        {
            var produto = new Produto
            {
                Id = 1,
                Nome = "Notebook",
                Descricao = "Notebook teste",
                Preco = 3500,
                QuantidadeEstoque = 1,
                Status = StatusProduto.Ativo,
                DataCriacao = DateTime.UtcNow
            };

            var request = new CriarPedidoRequest
            {
                Itens =
                [
                    new()
            {
                ProdutoId = 1,
                Quantidade = 1
            }
                ]
            };

            var transacaoMock =
                new Mock<IDbContextTransaction>();

            _pedidoRepositoryMock
                .Setup(x => x.ObterIdempotenciaAsync(
                    "pedido-concorrente"))
                .ReturnsAsync((Idempotencia?)null);

            _pedidoRepositoryMock
                .Setup(x => x.ObterProdutosAsync(
                    It.IsAny<IEnumerable<long>>()))
                .ReturnsAsync([produto]);

            _pedidoRepositoryMock
                .Setup(x => x.IniciarTransacaoAsync())
                .ReturnsAsync(
                    transacaoMock.Object);

            _pedidoRepositoryMock
                .Setup(x => x.AdicionarAsync(
                    It.IsAny<Pedido>()))
                .Callback<Pedido>(pedido =>
                {
                    pedido.Id = 1;
                })
                .Returns(Task.CompletedTask);

            _pedidoRepositoryMock
                .Setup(x => x.AdicionarIdempotenciaAsync(
                    It.IsAny<Idempotencia>()))
                .Returns(Task.CompletedTask);

            _pedidoRepositoryMock
                .Setup(x => x.SalvarAlteracoesAsync())
                .Returns(Task.CompletedTask);

            _pedidoRepositoryMock
                .Setup(x => x.ReservarEstoqueAsync(
                    produto.Id,
                    1))
                .ReturnsAsync(false);

            transacaoMock
                .Setup(x => x.RollbackAsync(
                    It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            transacaoMock
                .Setup(x => x.CommitAsync(
                    It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            transacaoMock
                .Setup(x => x.DisposeAsync())
                .Returns(ValueTask.CompletedTask);

            var exception =
                await Assert.ThrowsAsync<InvalidOperationException>(
                    () => _pedidoService.CriarAsync(
                        request,
                        "pedido-concorrente"));

            Assert.Equal(
                "Estoque insuficiente para o produto Notebook.",
                exception.Message);

            _pedidoRepositoryMock.Verify(
                x => x.ReservarEstoqueAsync(
                    produto.Id,
                    1),
                Times.Once);

            transacaoMock.Verify(
                x => x.RollbackAsync(
                    It.IsAny<CancellationToken>()),
                Times.Once);

            transacaoMock.Verify(
                x => x.CommitAsync(
                    It.IsAny<CancellationToken>()),
                Times.Never);

            transacaoMock.Verify(
                x => x.DisposeAsync(),
                Times.Once);
        }

        [Fact]
        public async Task AtualizarStatus_StatusAlteradoPorOutraOperacao_DeveFazerRollback()
        {
            var pedido = new Pedido
            {
                Id = 1,
                Status = StatusPedido.Pendente,
                DataCriacao = DateTime.UtcNow,
                DataAtualizacao = DateTime.UtcNow,
                ValorProdutos = 100,
                Desconto = 0,
                ValorTotal = 100
            };

            var transacaoMock =
                ConfigurarAtualizacaoStatus(
                    pedido,
                    false);

            var request =
                new AtualizarStatusPedidoRequest
                {
                    Status =
                        StatusPedido.Processando
                };

            var exception =
                await Assert.ThrowsAsync<InvalidOperationException>(
                    () => _pedidoService.AtualizarStatusAsync(
                        pedido.Id,
                        request));

            Assert.Equal(
                "O status do pedido foi alterado por outra operação. Atualize os dados e tente novamente.",
                exception.Message);

            _pedidoRepositoryMock.Verify(
                x => x.AtualizarStatusCondicionalAsync(
                    pedido.Id,
                    StatusPedido.Pendente,
                    StatusPedido.Processando,
                    It.IsAny<DateTime>()),
                Times.Once);

            _pedidoRepositoryMock.Verify(
                x => x.DevolverEstoqueAsync(
                    It.IsAny<long>(),
                    It.IsAny<int>()),
                Times.Never);

            transacaoMock.Verify(
                x => x.CommitAsync(
                    It.IsAny<CancellationToken>()),
                Times.Never);

            transacaoMock.Verify(
                x => x.RollbackAsync(
                    It.IsAny<CancellationToken>()),
                Times.Once);

            transacaoMock.Verify(
                x => x.DisposeAsync(),
                Times.Once);
        }

        [Fact]
        public async Task CriarPedido_MaisDe10Unidades_DeveAplicarDescontoDe10PorCento()
        {
            var produto = new Produto
            {
                Id = 1,
                Nome = "Monitor",
                Descricao = "Monitor teste",
                Preco = 100,
                QuantidadeEstoque = 20,
                Status = StatusProduto.Ativo,
                DataCriacao = DateTime.UtcNow
            };

            ConfigurarCriacaoPedido(
                produto);

            var request = new CriarPedidoRequest
            {
                Itens =
                [
                    new()
            {
                ProdutoId = 1,
                Quantidade = 11
            }
                ]
            };

            var resultado =
                await _pedidoService.CriarAsync(
                    request,
                    "pedido-desconto-10");

            Assert.NotNull(resultado);

            Assert.Equal(
                1100,
                resultado.ValorProdutos);

            Assert.Equal(
                110,
                resultado.Desconto);

            Assert.Equal(
                990,
                resultado.ValorTotal);
        }

        [Fact]
        public async Task CriarPedido_De6A10Unidades_DeveAplicarDescontoDe5PorCento()
        {
            var produto = new Produto
            {
                Id = 1,
                Nome = "Teclado",
                Descricao = "Teclado teste",
                Preco = 100,
                QuantidadeEstoque = 20,
                Status = StatusProduto.Ativo,
                DataCriacao = DateTime.UtcNow
            };

            ConfigurarCriacaoPedido(
                produto);

            var request = new CriarPedidoRequest
            {
                Itens =
                [
                    new()
            {
                ProdutoId = 1,
                Quantidade = 6
            }
                ]
            };

            var resultado =
                await _pedidoService.CriarAsync(
                    request,
                    "pedido-desconto-5");

            Assert.NotNull(resultado);

            Assert.Equal(
                600,
                resultado.ValorProdutos);

            Assert.Equal(
                30,
                resultado.Desconto);

            Assert.Equal(
                570,
                resultado.ValorTotal);
        }

        [Fact]
        public async Task CriarPedido_Ate5Unidades_NaoDeveAplicarDesconto()
        {
            var produto = new Produto
            {
                Id = 1,
                Nome = "Mouse",
                Descricao = "Mouse teste",
                Preco = 100,
                QuantidadeEstoque = 20,
                Status = StatusProduto.Ativo,
                DataCriacao = DateTime.UtcNow
            };

            var transacaoMock =
                ConfigurarCriacaoPedido(
                    produto);

            var request = new CriarPedidoRequest
            {
                Itens =
                [
                    new()
            {
                ProdutoId = 1,
                Quantidade = 5
            }
                ]
            };

            var resultado =
                await _pedidoService.CriarAsync(
                    request,
                    "pedido-sem-desconto");

            Assert.NotNull(resultado);

            Assert.Equal(
                500,
                resultado.ValorProdutos);

            Assert.Equal(
                0,
                resultado.Desconto);

            Assert.Equal(
                500,
                resultado.ValorTotal);

            Assert.Equal(
                StatusPedido.Pendente,
                resultado.Status);

            transacaoMock.Verify(
                x => x.CommitAsync(
                    It.IsAny<CancellationToken>()),
                Times.Once);
        }
        [Fact]
        public async Task CriarPedido_EstoqueInsuficiente_DeveLancarInvalidOperationException()
        {
            var request = new CriarPedidoRequest
            {
                Itens =
                [
                    new()
            {
                ProdutoId = 1,
                Quantidade = 6
            }
                ]
            };

            var produto = new Produto
            {
                Id = 1,
                Nome = "Mouse",
                Descricao = "Mouse teste",
                Preco = 100,
                QuantidadeEstoque = 5,
                Status = StatusProduto.Ativo,
                DataCriacao = DateTime.UtcNow
            };

            _pedidoRepositoryMock
                .Setup(x => x.ObterIdempotenciaAsync(
                    "teste-idempotencia"))
                .ReturnsAsync((Idempotencia?)null);

            _pedidoRepositoryMock
                .Setup(x => x.ObterProdutosAsync(
                    It.IsAny<IEnumerable<long>>()))
                .ReturnsAsync([produto]);

            var exception =
                await Assert.ThrowsAsync<InvalidOperationException>(
                    () => _pedidoService.CriarAsync(
                        request,
                        "teste-idempotencia"));

            Assert.Equal(
                "Estoque insuficiente para o produto Mouse.",
                exception.Message);

            _pedidoRepositoryMock.Verify(
                x => x.IniciarTransacaoAsync(),
                Times.Never);
        }

        [Fact]
        public async Task CriarPedido_ProdutoInativo_DeveLancarInvalidOperationException()
        {
            var request = new CriarPedidoRequest
            {
                Itens =
                [
                    new()
            {
                ProdutoId = 1,
                Quantidade = 1
            }
                ]
            };

            var produto = new Produto
            {
                Id = 1,
                Nome = "Notebook",
                Descricao = "Notebook teste",
                Preco = 3500,
                QuantidadeEstoque = 10,
                Status = StatusProduto.Inativo,
                DataCriacao = DateTime.UtcNow
            };

            _pedidoRepositoryMock
                .Setup(x => x.ObterIdempotenciaAsync(
                    "teste-idempotencia"))
                .ReturnsAsync((Idempotencia?)null);

            _pedidoRepositoryMock
                .Setup(x => x.ObterProdutosAsync(
                    It.IsAny<IEnumerable<long>>()))
                .ReturnsAsync([produto]);

            var exception =
                await Assert.ThrowsAsync<InvalidOperationException>(
                    () => _pedidoService.CriarAsync(
                        request,
                        "teste-idempotencia"));

            Assert.Equal(
                "O produto Notebook está inativo.",
                exception.Message);

            _pedidoRepositoryMock.Verify(
                x => x.IniciarTransacaoAsync(),
                Times.Never);
        }

        [Fact]
        public async Task CriarPedido_ProdutoInexistente_DeveLancarArgumentException()
        {
            var request = new CriarPedidoRequest
            {
                Itens =
                [
                    new()
            {
                ProdutoId = 99,
                Quantidade = 1
            }
                ]
            };

            _pedidoRepositoryMock
                .Setup(x => x.ObterIdempotenciaAsync(
                    "teste-idempotencia"))
                .ReturnsAsync((Idempotencia?)null);

            _pedidoRepositoryMock
                .Setup(x => x.ObterProdutosAsync(
                    It.IsAny<IEnumerable<long>>()))
                .ReturnsAsync([]);

            var exception =
                await Assert.ThrowsAsync<ArgumentException>(
                    () => _pedidoService.CriarAsync(
                        request,
                        "teste-idempotencia"));

            Assert.Equal(
                "O produto 99 não foi encontrado.",
                exception.Message);

            _pedidoRepositoryMock.Verify(
                x => x.IniciarTransacaoAsync(),
                Times.Never);
        }

        [Fact]
        public async Task CriarPedido_ChaveIdempotenciaVazia_DeveLancarArgumentException()
        {
            var request = new CriarPedidoRequest
            {
                Itens =
                [
                    new()
                    {
                        ProdutoId = 1,
                        Quantidade = 1
                    }
                ]
            };

            var exception =
                await Assert.ThrowsAsync<ArgumentException>(
                    () => _pedidoService.CriarAsync(
                        request,
                        ""));

            Assert.Equal(
                "A chave de idempotência é obrigatória.",
                exception.Message);

            _pedidoRepositoryMock.Verify(
                x => x.ObterIdempotenciaAsync(
                    It.IsAny<string>()),
                Times.Never);
        }

        [Fact]
        public async Task CriarPedido_SemItens_DeveLancarArgumentException()
        {
            var request = new CriarPedidoRequest
            {
                Itens = []
            };

            var exception =
                await Assert.ThrowsAsync<ArgumentException>(
                    () => _pedidoService.CriarAsync(
                        request,
                        "teste-idempotencia"));

            Assert.Equal(
                "O pedido deve possuir pelo menos um item.",
                exception.Message);

            _pedidoRepositoryMock.Verify(
                x => x.ObterIdempotenciaAsync(
                    It.IsAny<string>()),
                Times.Never);
        }

        [Fact]
        public async Task CriarPedido_QuantidadeZero_DeveLancarArgumentException()
        {
            var request = new CriarPedidoRequest
            {
                Itens =
                [
                    new()
                    {
                        ProdutoId = 1,
                        Quantidade = 0
                    }
                ]
            };

            var exception =
                await Assert.ThrowsAsync<ArgumentException>(
                    () => _pedidoService.CriarAsync(
                        request,
                        "teste-idempotencia"));

            Assert.Equal(
                "A quantidade dos itens deve ser maior que zero.",
                exception.Message);

            _pedidoRepositoryMock.Verify(
                x => x.ObterIdempotenciaAsync(
                    It.IsAny<string>()),
                Times.Never);
        }

        [Fact]
        public async Task CriarPedido_ChaveIdempotenciaMaiorQue100_DeveLancarArgumentException()
        {
            var request = new CriarPedidoRequest
            {
                Itens =
                [
                    new()
                    {
                        ProdutoId = 1,
                        Quantidade = 1
                    }
                ]
            };

            var chave =
                new string('A', 101);

            var exception =
                await Assert.ThrowsAsync<ArgumentException>(
                    () => _pedidoService.CriarAsync(
                        request,
                        chave));

            Assert.Equal(
                "A chave de idempotência deve possuir no máximo 100 caracteres.",
                exception.Message);

            _pedidoRepositoryMock.Verify(
                x => x.ObterIdempotenciaAsync(
                    It.IsAny<string>()),
                Times.Never);
        }
    }
}