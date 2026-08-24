using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OrderManagement.Api.Middlewares;
using OrderManagement.Api.Models;
using OrderManagement.Application.Interfaces;
using OrderManagement.Application.Services;
using OrderManagement.Infrastructure.Context;
using OrderManagement.Infrastructure.Repositories;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlServer(
      builder.Configuration.GetConnectionString("DefaultConnection"));
});

builder.Services
    .AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var camposInvalidos = context.ModelState
                .Where(x => x.Value?.Errors.Count > 0)
                .Select(x => x.Key)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .ToList();

            var message =
                camposInvalidos.Count == 1
                    ? $"O campo {camposInvalidos[0]} possui um valor inválido."
                    : "Um ou mais campos possuem valores inválidos.";

            var response = new ErroResponse
            {
                Message = message,
                Code = "VALIDATION_ERROR",
                TraceId = context.HttpContext.TraceIdentifier
            };

            return new BadRequestObjectResult(response);
        };
    });

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen();

builder.Services.AddScoped<IProdutoRepository, ProdutoRepository>();

builder.Services.AddScoped<IProdutoService, ProdutoService>();

builder.Services.AddScoped<IPedidoRepository, PedidoRepository>();

builder.Services.AddScoped<IPedidoService, PedidoService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:3000")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

var aplicarMigrations =
    app.Configuration.GetValue<bool>(
        "Database:ApplyMigrations");

if (aplicarMigrations)
{
    using var scope =
        app.Services.CreateScope();

    var context =
        scope.ServiceProvider
            .GetRequiredService<ApplicationDbContext>();

    context.Database.Migrate();

}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");

app.UseHttpsRedirection();

app.UseCors("Frontend");

app.UseMiddleware<TratamentoErrosMiddleware>();

app.MapControllers();

app.Run();