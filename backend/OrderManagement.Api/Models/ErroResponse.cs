namespace OrderManagement.Api.Models
{
    public class ErroResponse
    {
        public string Message { get; set; } = string.Empty;

        public string Code { get; set; } = string.Empty;

        public string TraceId { get; set; } = string.Empty;
    }
}