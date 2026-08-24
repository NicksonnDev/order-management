using Microsoft.EntityFrameworkCore;
using OrderManagement.Domain.Entities;

namespace OrderManagement.Infrastructure.Context
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
          : base(options)
        {
        }

        public DbSet<Produto> Produtos { get; set; }

        public DbSet<Pedido> Pedidos { get; set; }

        public DbSet<ItemPedido> ItensPedido { get; set; }

        public DbSet<Idempotencia> Idempotencias { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            ConfigurarProduto(modelBuilder);

            ConfigurarPedido(modelBuilder);

            ConfigurarItemPedido(modelBuilder);

            ConfigurarIdempotencia(modelBuilder);
        }

        private static void ConfigurarProduto(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Produto>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Nome)
                  .HasMaxLength(200)
                  .IsRequired();

                entity.Property(x => x.Descricao)
                  .HasMaxLength(1000);

                entity.Property(x => x.Preco)
                  .HasColumnType("decimal(18,2)");
            });
        }

        private static void ConfigurarPedido(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Pedido>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.ValorProdutos)
                    .HasColumnType("decimal(18,2)");

                entity.Property(x => x.Desconto)
                    .HasColumnType("decimal(18,2)");

                entity.Property(x => x.ValorTotal)
                    .HasColumnType("decimal(18,2)");
            });
        }

        private static void ConfigurarItemPedido(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ItemPedido>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Quantidade)
                    .IsRequired();

                entity.Property(x => x.PrecoUnitario)
                    .HasColumnType("decimal(18,2)");

                entity.Property(x => x.ValorTotal)
                    .HasColumnType("decimal(18,2)");

                entity.HasOne(x => x.Pedido)
                    .WithMany(x => x.Itens)
                    .HasForeignKey(x => x.PedidoId);

                entity.HasOne(x => x.Produto)
                    .WithMany(x => x.ItensPedido)
                    .HasForeignKey(x => x.ProdutoId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }

        private static void ConfigurarIdempotencia(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Idempotencia>(entity =>
            {
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Chave)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(x => x.HashRequisicao)
                    .HasMaxLength(64)
                    .IsRequired();

                entity.HasIndex(x => x.Chave)
                    .IsUnique();

                entity.HasOne(x => x.Pedido)
                    .WithOne()
                    .HasForeignKey<Idempotencia>(x => x.PedidoId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}