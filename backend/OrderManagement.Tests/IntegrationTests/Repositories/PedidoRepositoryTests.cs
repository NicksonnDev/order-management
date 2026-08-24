using Microsoft.EntityFrameworkCore;
using OrderManagement.Domain.Entities;
using OrderManagement.Domain.Enums;
using OrderManagement.Infrastructure.Context;
using OrderManagement.Infrastructure.Repositories;

namespace OrderManagement.Tests.IntegrationTests.Repositories
{
    public class PedidoRepositoryTests
    {
        [Fact]
        public async Task ReservarEstoque_DuasOperacoesConcorrentes_ApenasUmaDeveTerSucesso()
        {
            var nomeBanco =
                $"OrderManagementTests_{Guid.NewGuid():N}";

            var connectionString =
                $"Server=(localdb)\\MSSQLLocalDB;" +
                $"Database={nomeBanco};" +
                "Trusted_Connection=True;" +
                "TrustServerCertificate=True;";

            var options =
                new DbContextOptionsBuilder<ApplicationDbContext>()
                    .UseSqlServer(connectionString)
                    .Options;

            try
            {
                long produtoId;

                await using (
                    var context =
                        new ApplicationDbContext(options))
                {
                    await context.Database.EnsureCreatedAsync();

                    var produto = new Produto
                    {
                        Nome = "Produto Concorrência",
                        Descricao = "Produto com apenas uma unidade",
                        Preco = 100,
                        QuantidadeEstoque = 1,
                        Status = StatusProduto.Ativo,
                        DataCriacao = DateTime.UtcNow
                    };

                    context.Produtos.Add(produto);

                    await context.SaveChangesAsync();

                    produtoId = produto.Id;
                }

                await using var contextA =
                    new ApplicationDbContext(options);

                await using var contextB =
                    new ApplicationDbContext(options);

                var repositoryA =
                    new PedidoRepository(contextA);

                var repositoryB =
                    new PedidoRepository(contextB);

                var tarefaA =
                    repositoryA.ReservarEstoqueAsync(
                        produtoId,
                        1);

                var tarefaB =
                    repositoryB.ReservarEstoqueAsync(
                        produtoId,
                        1);

                var resultados =
                    await Task.WhenAll(
                        tarefaA,
                        tarefaB);

                Assert.Single(
                    resultados,
                    resultado => resultado);

                Assert.Single(
                    resultados,
                    resultado => !resultado);

                await using var contextValidacao =
                    new ApplicationDbContext(options);

                var produtoAtualizado =
                    await contextValidacao.Produtos
                        .AsNoTracking()
                        .SingleAsync(
                            produto =>
                                produto.Id == produtoId);

                Assert.Equal(
                    0,
                    produtoAtualizado.QuantidadeEstoque);

                Assert.True(
                    produtoAtualizado.QuantidadeEstoque >= 0);
            }
            finally
            {
                await using var context =
                    new ApplicationDbContext(options);

                await context.Database.EnsureDeletedAsync();
            }
        }
    }
}