using OrderManagement.Domain.Enums;

namespace OrderManagement.Application.DTOs.Produtos
{
    public class AtualizarProdutoRequest
    {
        public string Nome { get; set; } = string.Empty;

        public string Descricao { get; set; } = string.Empty;

        public decimal Preco { get; set; }

        public StatusProduto Status { get; set; }
    }
}