using OrderManagement.Domain.Enums;

namespace OrderManagement.Application.DTOs.Produtos
{
    public class ListarProdutosRequest
    {
        public int Pagina { get; set; } = 1;

        public int TamanhoPagina { get; set; } = 50;

        public string? Nome { get; set; }

        public StatusProduto? Status { get; set; }

        public string OrdenarPor { get; set; } = "nome";

        public string Direcao { get; set; } = "asc";
    }
}