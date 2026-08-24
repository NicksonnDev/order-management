using Microsoft.AspNetCore.Mvc;
using OrderManagement.Api.Models;
using OrderManagement.Application.DTOs.Common;
using OrderManagement.Application.DTOs.Pedidos;
using OrderManagement.Application.Interfaces;

namespace OrderManagement.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PedidosController : ControllerBase
    {
        private readonly IPedidoService _pedidoService;

        public PedidosController(IPedidoService pedidoService)
        {
            _pedidoService = pedidoService;
        }

        [HttpGet]
        public async Task<ActionResult<ResultadoPaginado<PedidoResumoResponse>>> Listar(
            [FromQuery] ListarPedidosRequest request)
        {
            var resultado = await _pedidoService.ListarAsync(request);

            return Ok(resultado);
        }

        [HttpGet("{id:long}")]
        public async Task<ActionResult<PedidoResponse>> ObterPorId(long id)
        {
            var pedido = await _pedidoService.ObterPorIdAsync(id);

            if (pedido == null)
            {
                return NotFound(new ErroResponse
                {
                    Message = "Pedido não encontrado.",
                    Code = "ORDER_NOT_FOUND",
                    TraceId = HttpContext.TraceIdentifier
                });
            }

            return Ok(pedido);
        }

        [HttpPost]
        public async Task<ActionResult<PedidoResponse>> Criar(
            [FromHeader(Name = "Idempotency-Key")] string chaveIdempotencia,
            [FromBody] CriarPedidoRequest request)
        {
            var pedido = await _pedidoService.CriarAsync(request, chaveIdempotencia);

            return CreatedAtAction(
                nameof(ObterPorId),
                new { id = pedido.Id },
                pedido);
        }

        [HttpPut("{id:long}/status")]
        public async Task<ActionResult<PedidoResponse>> AtualizarStatus(
            long id,
            [FromBody] AtualizarStatusPedidoRequest request)
        {
            var pedido = await _pedidoService.AtualizarStatusAsync(id, request);

            if (pedido == null)
            {
                return NotFound(new ErroResponse
                {
                    Message = "Pedido não encontrado.",
                    Code = "ORDER_NOT_FOUND",
                    TraceId = HttpContext.TraceIdentifier
                });
            }

            return Ok(pedido);
        }
    }
}