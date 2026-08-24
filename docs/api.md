# API

## Produtos

| Método | Endpoint |
| --- | --- |
| GET | /api/produtos |
| GET | /api/produtos/{id} |
| POST | /api/produtos |
| PUT | /api/produtos/{id} |
| PATCH | /api/produtos/{id}/ativar |
| PATCH | /api/produtos/{id}/inativar |

---

## Pedidos

| Método | Endpoint |
| --- | --- |
| GET | /api/pedidos |
| GET | /api/pedidos/{id} |
| POST | /api/pedidos |
| PATCH | /api/pedidos/{id}/status |

---

## Códigos HTTP

| Código | Descrição |
| --- | --- |
| 200 | OK |
| 201 | Criado |
| 400 | Requisição inválida |
| 404 | Não encontrado |
| 409 | Conflito |
| 500 | Erro interno |

---

## Exemplos

### Criar produto

POST /api/produtos

### Criar pedido

POST /api/pedidos