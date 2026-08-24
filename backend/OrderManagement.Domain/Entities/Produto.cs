using OrderManagement.Domain.Enums;

namespace OrderManagement.Domain.Entities
{
    public class Produto
    {
        public long Id { get; set; }

        public string Nome { get; set; } = string.Empty;

        public string Descricao { get; set; } = string.Empty;

        public decimal Preco { get; set; }

        public int QuantidadeEstoque { get; set; }

        public StatusProduto Status { get; set; }

        public DateTime DataCriacao { get; set; }

        public ICollection<ItemPedido> ItensPedido { get; set; } = new List<ItemPedido>();
    }
}