# Idempotência

## Problema

Uma requisição pode ser enviada mais de uma vez.

---

## Solução

Utilização de uma chave de idempotência.

---

## Cabeçalho

Idempotency-Key

---

## Fluxo

1. O cliente envia a requisição.

2. O servidor armazena a chave.

3. O cliente envia a mesma requisição novamente.

4. O servidor identifica a duplicidade.

5. O pedido não é criado novamente.