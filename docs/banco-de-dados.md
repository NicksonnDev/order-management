# Banco de dados

## Entidades

### Produto

| Campo | Tipo |
| --- | --- |
| Id | bigint |
| Nome | varchar |
| Descricao | varchar |
| Preco | decimal |
| QuantidadeEstoque | int |
| Status | varchar |
| DataCriacao | datetime |

---

### Pedido

| Campo | Tipo |
| --- | --- |
| Id | bigint |
| DataCriacao | datetime |
| Status | varchar |
| ValorProdutos | decimal |
| Desconto | decimal |
| ValorTotal | decimal |

---

### ItemPedido

| Campo | Tipo |
| --- | --- |
| Id | bigint |
| PedidoId | bigint |
| ProdutoId | bigint |
| Quantidade | int |
| PrecoUnitario | decimal |
| ValorTotal | decimal |

---

## Relacionamentos

Pedido

↓

ItensPedido

↓

Produto