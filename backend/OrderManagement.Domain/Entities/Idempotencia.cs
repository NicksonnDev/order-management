namespace OrderManagement.Domain.Entities
{
    public class Idempotencia
    {
        public long Id { get; set; }

        public string Chave { get; set; } = string.Empty;

        public string HashRequisicao { get; set; } = string.Empty;

        public long PedidoId { get; set; }

        public Pedido Pedido { get; set; } = null!;

        public DateTime DataCriacao { get; set; }

        public string Resposta { get; set; } = string.Empty;
    }
}