using System.Net;
using System.Text.Json;
using OrderManagement.Api.Models;

namespace OrderManagement.Api.Middlewares
{
    public class TratamentoErrosMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<TratamentoErrosMiddleware> _logger;

        public TratamentoErrosMiddleware(
            RequestDelegate next,
            ILogger<TratamentoErrosMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (ArgumentException ex)
            {
                await EscreverErroAsync(
                    context,
                    HttpStatusCode.BadRequest,
                    ex.Message,
                    "VALIDATION_ERROR");
            }
            catch (InvalidOperationException ex)
            {
                await EscreverErroAsync(
                    context,
                    HttpStatusCode.Conflict,
                    ex.Message,
                    "BUSINESS_RULE_VIOLATION");
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Erro interno não tratado. TraceId: {TraceId}",
                    context.TraceIdentifier);

                await EscreverErroAsync(
                    context,
                    HttpStatusCode.InternalServerError,
                    "Ocorreu um erro interno no servidor.",
                    "INTERNAL_ERROR");
            }
        }

        private static async Task EscreverErroAsync(
            HttpContext context,
            HttpStatusCode statusCode,
            string message,
            string code)
        {
            context.Response.StatusCode = (int)statusCode;
            context.Response.ContentType = "application/json";

            var response = new ErroResponse
            {
                Message = message,
                Code = code,
                TraceId = context.TraceIdentifier
            };

            var json = JsonSerializer.Serialize(
                response,
                new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

            await context.Response.WriteAsync(json);
        }
    }
}