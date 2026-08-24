using OrderManagement.Domain.Enums;

namespace OrderManagement.Application.DTOs.Produtos
{
    public class ProdutoResponse
    {
        public long Id { get; set; }

        public string Nome { get; set; } = string.Empty;

        public string Descricao { get; set; } = string.Empty;

        public decimal Preco { get; set; }

        public int QuantidadeEstoque { get; set; }

        public StatusProduto Status { get; set; }

        public DateTime DataCriacao { get; set; }
    }
}