using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using OrderManagement.Application.DTOs.Common;
using OrderManagement.Application.DTOs.Pedidos;
using OrderManagement.Application.Interfaces;
using OrderManagement.Domain.Entities;
using OrderManagement.Domain.Enums;

using System.Security.Cryptography;
using System.Text;

namespace OrderManagement.Application.Services
{
    public class PedidoService : IPedidoService
    {
        private readonly IPedidoRepository _pedidoRepository;

        public PedidoService(IPedidoRepository pedidoRepository)
        {
            _pedidoRepository = pedidoRepository;
        }

        public async Task<PedidoResponse?> ObterPorIdAsync(long id)
        {
            var pedido = await _pedidoRepository.ObterPorIdAsync(id);

            if (pedido == null)
            {
                return null;
            }

            return MapearParaResponse(pedido);
        }
        public async Task<ResultadoPaginado<PedidoResumoResponse>> ListarAsync(
    ListarPedidosRequest request)
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
                !Enum.IsDefined(typeof(StatusPedido), request.Status.Value))
            {
                throw new ArgumentException(
                    "O status informado é inválido.");
            }

            if (request.ValorMinimo.HasValue &&
                request.ValorMinimo.Value < 0)
            {
                throw new ArgumentException(
                    "O valor mínimo não pode ser negativo.");
            }

            if (request.ValorMaximo.HasValue &&
                request.ValorMaximo.Value < 0)
            {
                throw new ArgumentException(
                    "O valor máximo não pode ser negativo.");
            }

            if (request.ValorMinimo.HasValue &&
                request.ValorMaximo.HasValue &&
                request.ValorMinimo.Value > request.ValorMaximo.Value)
            {
                throw new ArgumentException(
                    "O valor mínimo não pode ser maior que o valor máximo.");
            }

            if (request.DataInicial.HasValue &&
                request.DataFinal.HasValue &&
                request.DataInicial.Value.Date > request.DataFinal.Value.Date)
            {
                throw new ArgumentException(
                    "A data inicial não pode ser maior que a data final.");
            }


            var dataInicial =
                request.DataInicial?.Date;

            var dataFinal =
                request.DataFinal?.Date.AddDays(1);

            var skip =
                (request.Pagina - 1) *
                request.TamanhoPagina;

            var resultado =
                await _pedidoRepository.ListarAsync(
                    request.Status,
                    dataInicial,
                    dataFinal,
                    request.ValorMinimo,
                    request.ValorMaximo,
                    skip,
                    request.TamanhoPagina);

            return new ResultadoPaginado<PedidoResumoResponse>
            {
                Itens = resultado.Itens
                    .Select(MapearParaResumoResponse)
                    .ToList(),

                Pagina = request.Pagina,

                TamanhoPagina = request.TamanhoPagina,

                TotalItens = resultado.TotalItens,

                TotalPaginas =
                    (int)Math.Ceiling(
                        resultado.TotalItens /
                        (double)request.TamanhoPagina)
            };
        }

        private static PedidoResumoResponse MapearParaResumoResponse(
            Pedido pedido)
        {
            return new PedidoResumoResponse
            {
                Id = pedido.Id,
                DataCriacao = pedido.DataCriacao,
                Status = pedido.Status,
                ValorProdutos = pedido.ValorProdutos,
                Desconto = pedido.Desconto,
                ValorTotal = pedido.ValorTotal
            };
        }

        public async Task<PedidoResponse> CriarAsync(
            CriarPedidoRequest request,
            string chaveIdempotencia)
        {
            chaveIdempotencia = chaveIdempotencia?.Trim() ?? string.Empty;

            ValidarPedido(request, chaveIdempotencia);

            var hashRequisicao = GerarHashRequisicao(request);

            var idempotencia =
                await _pedidoRepository.ObterIdempotenciaAsync(
                    chaveIdempotencia);


            if (idempotencia != null)
            {
                if (idempotencia.HashRequisicao != hashRequisicao)
                {
                    throw new InvalidOperationException(
                        "A chave de idempotência já foi utilizada com outra requisição.");
                }

                var pedidoExistente =
                    await _pedidoRepository.ObterPorIdAsync(
                        idempotencia.PedidoId);

                if (pedidoExistente != null)
                {
                    return MapearParaResponse(pedidoExistente);
                }
            }

            var idsProdutos = request.Itens
                .Select(x => x.ProdutoId)
                .Distinct()
                .ToList();

            var produtos = await _pedidoRepository.ObterProdutosAsync(
                idsProdutos);

            ValidarProdutos(request, produtos);

            var transacao =
                await _pedidoRepository.IniciarTransacaoAsync();

            try
            {
                var pedido = new Pedido
                {
                    DataCriacao = DateTime.UtcNow,
                    DataAtualizacao = DateTime.UtcNow,
                    Status = StatusPedido.Pendente
                };

                await _pedidoRepository.AdicionarAsync(pedido);

                await _pedidoRepository.SalvarAlteracoesAsync();

                var idempotenciaNova = new Idempotencia
                {
                    Chave = chaveIdempotencia,
                    HashRequisicao = hashRequisicao,
                    PedidoId = pedido.Id,
                    DataCriacao = DateTime.UtcNow,
                    Resposta = string.Empty
                };

                await _pedidoRepository.AdicionarIdempotenciaAsync(
                    idempotenciaNova);

                await _pedidoRepository.SalvarAlteracoesAsync();

                foreach (var itemRequest in request.Itens)
                {
                    var produto = produtos.First(
                        x => x.Id == itemRequest.ProdutoId);

                    var estoqueReservado =
                        await _pedidoRepository.ReservarEstoqueAsync(
                            produto.Id,
                            itemRequest.Quantidade);

                    if (!estoqueReservado)
                    {
                        throw new InvalidOperationException(
                            $"Estoque insuficiente para o produto {produto.Nome}.");
                    }

                    var item = new ItemPedido
                    {
                        ProdutoId = produto.Id,
                        Produto = produto,
                        Quantidade = itemRequest.Quantidade,
                        PrecoUnitario = produto.Preco,
                        ValorTotal =
                        produto.Preco * itemRequest.Quantidade
                    };

                    pedido.Itens.Add(item);
                }

                pedido.ValorProdutos = pedido.Itens.Sum(
                    x => x.ValorTotal);

                var quantidadeTotal = pedido.Itens.Sum(
                    x => x.Quantidade);

                pedido.Desconto = CalcularDesconto(
                    pedido.ValorProdutos,
                    quantidadeTotal);

                pedido.ValorTotal =
                    pedido.ValorProdutos - pedido.Desconto;

                await _pedidoRepository.SalvarAlteracoesAsync();

                await transacao.CommitAsync();

                return MapearParaResponse(pedido);
            }

            catch (DbUpdateException ex) when (EhViolacaoIdempotencia(ex))
            {
                await transacao.RollbackAsync();

                var idempotenciaExistente =
                    await _pedidoRepository.ObterIdempotenciaAsync(
                        chaveIdempotencia);

                if (idempotenciaExistente != null)
                {
                    if (idempotenciaExistente.HashRequisicao != hashRequisicao)
                    {
                        throw new InvalidOperationException(
                            "A chave de idempotência já foi utilizada com outra requisição.");
                    }

                    var pedidoExistente =
                        await _pedidoRepository.ObterPorIdAsync(
                            idempotenciaExistente.PedidoId);

                    if (pedidoExistente != null)
                    {
                        return MapearParaResponse(pedidoExistente);
                    }
                }

                throw;
            }
            catch
            {
                await transacao.RollbackAsync();

                throw;
            }
            finally
            {
                await transacao.DisposeAsync();
            }
        }

        private static bool EhViolacaoIdempotencia(
            DbUpdateException ex)
        {
            if (ex.InnerException is not SqlException sqlException)
            {
                return false;
            }

            if (sqlException.Number != 2601 &&
                sqlException.Number != 2627)
            {
                return false;
            }

            return sqlException.Message.Contains(
                "IX_Idempotencias_Chave",
                StringComparison.OrdinalIgnoreCase);
        }

        private static void ValidarPedido(
            CriarPedidoRequest request,
            string chaveIdempotencia)
        {
            if (string.IsNullOrWhiteSpace(chaveIdempotencia))
            {
                throw new ArgumentException(
                    "A chave de idempotência é obrigatória.");
            }

            if (request.Itens == null ||
                request.Itens.Count == 0)
            {
                throw new ArgumentException(
                    "O pedido deve possuir pelo menos um item.");
            }

            if (request.Itens.Any(x => x.Quantidade <= 0))
            {
                throw new ArgumentException(
                    "A quantidade dos itens deve ser maior que zero.");
            }

            if (chaveIdempotencia.Length > 100)
            {
                throw new ArgumentException(
                    "A chave de idempotência deve possuir no máximo 100 caracteres.");
            }
        }

        private static void ValidarProdutos(
            CriarPedidoRequest request,
            List<Produto> produtos)
        {
            var idsSolicitados = request.Itens
                .Select(x => x.ProdutoId)
                .Distinct()
                .ToList();

            var idsEncontrados = produtos
                .Select(x => x.Id)
                .ToHashSet();

            var produtoInexistente = idsSolicitados
                .FirstOrDefault(x => !idsEncontrados.Contains(x));

            if (produtoInexistente != 0)
            {
                throw new ArgumentException(
                    $"O produto {produtoInexistente} não foi encontrado.");
            }

            foreach (var item in request.Itens)
            {
                var produto = produtos.First(
                    x => x.Id == item.ProdutoId);

                if (produto.Status != StatusProduto.Ativo)
                {
                    throw new InvalidOperationException(
                        $"O produto {produto.Nome} está inativo.");
                }

                if (produto.QuantidadeEstoque < item.Quantidade)
                {
                    throw new InvalidOperationException(
                        $"Estoque insuficiente para o produto {produto.Nome}.");
                }
            }
        }

        private static decimal CalcularDesconto(
            decimal valorProdutos,
            int quantidadeTotal)
        {
            if (quantidadeTotal > 10)
            {
                return valorProdutos * 0.10m;
            }

            if (quantidadeTotal > 5)
            {
                return valorProdutos * 0.05m;
            }

            return 0;
        }

        private static PedidoResponse MapearParaResponse(
            Pedido pedido)
        {
            return new PedidoResponse
            {
                Id = pedido.Id,
                DataCriacao = pedido.DataCriacao,
                DataAtualizacao = pedido.DataAtualizacao,
                Status = pedido.Status,
                ValorProdutos = pedido.ValorProdutos,
                Desconto = pedido.Desconto,
                ValorTotal = pedido.ValorTotal,
                Itens = pedido.Itens
                    .Select(MapearItemParaResponse)
                    .ToList()
            };
        }

        private static ItemPedidoResponse MapearItemParaResponse(
            ItemPedido item)
        {
            return new ItemPedidoResponse
            {
                Id = item.Id,
                ProdutoId = item.ProdutoId,
                ProdutoNome = item.Produto.Nome,
                Quantidade = item.Quantidade,
                PrecoUnitario = item.PrecoUnitario,
                ValorTotal = item.ValorTotal
            };
        }


        private static bool PodeAlterarStatus(
            StatusPedido statusAtual,
            StatusPedido novoStatus)
        {
            return statusAtual switch
            {
                StatusPedido.Pendente =>
                    novoStatus == StatusPedido.Processando ||
                    novoStatus == StatusPedido.Cancelado,

                StatusPedido.Processando =>
                    novoStatus == StatusPedido.Concluido ||
                    novoStatus == StatusPedido.Cancelado,

                StatusPedido.Concluido => false,

                StatusPedido.Cancelado => false,

                _ => false
            };
        }

        private static string GerarHashRequisicao(
            CriarPedidoRequest request)
        {
            var conteudo = string.Join(
                "|",
                request.Itens
                    .OrderBy(x => x.ProdutoId)
                    .ThenBy(x => x.Quantidade)
                    .Select(x => $"{x.ProdutoId}:{x.Quantidade}"));

            var bytes = Encoding.UTF8.GetBytes(conteudo);

            var hash = SHA256.HashData(bytes);

            return Convert.ToHexString(hash);
        }

        public async Task<PedidoResponse?> AtualizarStatusAsync(
        long id,
        AtualizarStatusPedidoRequest request)
        {
            var pedido = await _pedidoRepository.ObterPorIdAsync(id);

            if (pedido == null)
            {
                return null;
            }

            if (!Enum.IsDefined(typeof(StatusPedido), request.Status))
            {
                throw new ArgumentException(
                    "O status do pedido é inválido.");
            }

            if (!PodeAlterarStatus(pedido.Status, request.Status))
            {
                throw new InvalidOperationException(
                    $"Não é possível alterar o pedido de {pedido.Status} para {request.Status}.");
            }

            var transacao =
                await _pedidoRepository.IniciarTransacaoAsync();

            try
            {
                var dataAtualizacao = DateTime.UtcNow;

                var statusAtualizado =
                    await _pedidoRepository.AtualizarStatusCondicionalAsync(
                        pedido.Id,
                        pedido.Status,
                        request.Status,
                        dataAtualizacao);

                if (!statusAtualizado)
                {
                    throw new InvalidOperationException(
                        "O status do pedido foi alterado por outra operação. Atualize os dados e tente novamente.");
                }

                if (request.Status == StatusPedido.Cancelado)
                {
                    foreach (var item in pedido.Itens)
                    {
                        await _pedidoRepository.DevolverEstoqueAsync(
                            item.ProdutoId,
                            item.Quantidade);
                    }
                }

                await transacao.CommitAsync();

                pedido.Status = request.Status;
                pedido.DataAtualizacao = dataAtualizacao;

                return MapearParaResponse(pedido);
            }
            catch
            {
                await transacao.RollbackAsync();

                throw;
            }
            finally
            {
                await transacao.DisposeAsync();
            }
        }
    }
}