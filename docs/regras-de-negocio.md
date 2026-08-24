# Regras de negócio

## Produtos

- Produtos inativos não podem ser adicionados aos pedidos.

---

## Estoque

- Não é permitido vender uma quantidade superior ao estoque.

- O estoque é atualizado somente após a confirmação do pedido.

---

## Pedidos

- O pedido deve possuir pelo menos um item.

- A quantidade deve ser maior que zero.

- O valor total é calculado pelo backend.

- O preço do produto é congelado no momento da criação do pedido.

---

## Status

Transições válidas:

- Pendente → Processando

- Processando → Concluído

- Pendente → Cancelado

- Processando → Cancelado