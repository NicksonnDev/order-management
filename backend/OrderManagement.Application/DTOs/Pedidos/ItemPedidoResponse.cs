public class ItemPedidoResponse
{
    public long Id { get; set; }

    public long ProdutoId { get; set; }

    public string ProdutoNome { get; set; } = string.Empty;

    public int Quantidade { get; set; }

    public decimal PrecoUnitario { get; set; }

    public decimal ValorTotal { get; set; }
}