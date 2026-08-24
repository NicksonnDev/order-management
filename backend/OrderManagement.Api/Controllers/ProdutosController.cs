using Microsoft.AspNetCore.Mvc;
using OrderManagement.Api.Models;
using OrderManagement.Application.DTOs.Common;
using OrderManagement.Application.DTOs.Produtos;
using OrderManagement.Application.Interfaces;

namespace OrderManagement.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProdutosController : ControllerBase
    {
        private readonly IProdutoService _produtoService;

        public ProdutosController(IProdutoService produtoService)
        {
            _produtoService = produtoService;
        }

        [HttpGet]
        public async Task<ActionResult<ResultadoPaginado<ProdutoResponse>>> Listar(
            [FromQuery] ListarProdutosRequest request)
        {
            var resultado = await _produtoService.ListarAsync(request);

            return Ok(resultado);
        }

        [HttpGet("{id:long}")]
        public async Task<ActionResult<ProdutoResponse>> ObterPorId(long id)
        {
            var produto = await _produtoService.ObterPorIdAsync(id);

            if (produto == null)
            {
                return NotFound(new ErroResponse
                {
                    Message = "Produto não encontrado.",
                    Code = "PRODUCT_NOT_FOUND",
                    TraceId = HttpContext.TraceIdentifier
                });
            }

            return Ok(produto);
        }

        [HttpPost]
        public async Task<ActionResult<ProdutoResponse>> Criar(
            [FromBody] CriarProdutoRequest request)
        {
            var produto = await _produtoService.CriarAsync(request);

            return CreatedAtAction(
                nameof(ObterPorId),
                new { id = produto.Id },
                produto);
        }

        [HttpPut("{id:long}")]
        public async Task<ActionResult<ProdutoResponse>> Atualizar(
            long id,
            [FromBody] AtualizarProdutoRequest request)
        {
            var produto = await _produtoService.AtualizarAsync(id, request);

            if (produto == null)
            {
                return NotFound(new ErroResponse
                {
                    Message = "Produto não encontrado.",
                    Code = "PRODUCT_NOT_FOUND",
                    TraceId = HttpContext.TraceIdentifier
                });
            }

            return Ok(produto);
        }
    }
}