# Order Management System

Sistema para gerenciamento de produtos, estoque e pedidos, desenvolvido como teste técnico para uma posição de Desenvolvedor Fullstack Pleno.

O projeto foi construído com foco em regras de negócio no backend, consistência transacional, controle de concorrência, idempotência, tratamento padronizado de erros, testes automatizados e uma interface simples para operação.

---

## Tecnologias

### Backend

- .NET 9
- ASP.NET Core Web API
- Entity Framework Core 9
- SQL Server / SQL Server LocalDB
- Swagger / OpenAPI
- xUnit
- Moq

### Frontend

- React 18
- Next.js 16
- TypeScript
- CSS

---

## Estrutura do projeto

```text
order-management-system/
├── backend/
│   ├── OrderManagement.Api/
│   ├── OrderManagement.Application/
│   ├── OrderManagement.Domain/
│   ├── OrderManagement.Infrastructure/
│   ├── OrderManagement.Tests/
│   └── OrderManagement.sln
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   └── types/
│   └── package.json
├── docs/
├── docker/
│   ├── backend.Dockerfile
│   └── frontend.Dockerfile
├── .dockerignore
├── docker-compose.yml
├── .env
├── .gitignore
└── README.md
```

---

## Arquitetura

O backend foi separado em quatro camadas principais.

### Domain

Contém as entidades e enums do domínio.

Principais entidades:

- `Produto`
- `Pedido`
- `ItemPedido`
- `Idempotencia`

Principais enums:

- `StatusProduto`
- `StatusPedido`

### Application

Contém DTOs, interfaces, serviços, validações, regras de negócio, cálculo de valores, regras de desconto e controle de status.

Principais serviços:

- `ProdutoService`
- `PedidoService`

### Infrastructure

Responsável pelo acesso a dados e persistência.

Contém:

- `ApplicationDbContext`;
- configurações do Entity Framework Core;
- migrations;
- implementações dos repositórios;
- operações atômicas de estoque;
- integração com SQL Server.

### Api

Responsável pela exposição HTTP da aplicação.

Contém:

- controllers;
- configuração de dependency injection;
- Swagger;
- CORS;
- middleware global de erros.

---

## Pré-requisitos

A aplicação pode ser executada de duas formas.

### Opção recomendada: Docker

Para executar todo o ambiente com Docker:

- Git;
- Docker Desktop ou Docker Engine;
- Docker Compose.

O Docker sobe automaticamente:

- SQL Server 2022;
- backend ASP.NET Core;
- frontend Next.js.

### Execução manual

Para executar sem Docker:

- .NET SDK 9;
- Node.js 20 ou superior;
- npm;
- SQL Server ou SQL Server LocalDB;
- Git.

No desenvolvimento local sem Docker foi utilizado:

```text
(localdb)\MSSQLLocalDB
```

---

## Banco de dados

Banco padrão:

```text
OrderManagement
```

Exemplo de connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\MSSQLLocalDB;Database=OrderManagement;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

Na execução manual, a connection string pode ser configurada em:

```text
backend/OrderManagement.Api/appsettings.json
```

ou:

```text
backend/OrderManagement.Api/appsettings.Development.json
```

No ambiente Docker, a connection string é fornecida pelo `docker-compose.yml` através de variável de ambiente e aponta para o serviço `sqlserver`.

---

## Executando com Docker

Esta é a forma recomendada para executar o projeto completo.

Na raiz do repositório, crie um arquivo `.env`:

```env
SA_PASSWORD=SuaSenhaForteAqui
```

A senha deve atender aos requisitos de segurança do SQL Server.

O arquivo `.env` não deve ser versionado.

Depois execute:

```powershell
docker compose up --build
```

Na primeira execução, o Docker irá:

1. baixar a imagem do SQL Server 2022;
2. construir a imagem do backend;
3. construir a imagem do frontend;
4. iniciar o SQL Server;
5. aguardar o banco ficar saudável;
6. iniciar a API;
7. aplicar automaticamente as migrations do Entity Framework Core;
8. iniciar o frontend.

Serviços disponíveis:

```text
Frontend
http://localhost:3000

Backend
http://localhost:5205

Swagger
http://localhost:5205/swagger

SQL Server
localhost:1433
```

Para verificar os containers:

```powershell
docker compose ps
```

Para visualizar os logs:

```powershell
docker compose logs
```

Ou por serviço:

```powershell
docker compose logs backend
docker compose logs frontend
docker compose logs sqlserver
```

Para encerrar os containers:

```powershell
docker compose down
```

O banco utiliza um volume Docker persistente, portanto os dados permanecem após `docker compose down`.

Para remover também o volume e recriar o banco do zero:

```powershell
docker compose down -v
```

### Migrations no Docker

O serviço `backend` recebe:

```text
Database__ApplyMigrations=true
```

Durante a inicialização, a API executa as migrations pendentes através do Entity Framework Core.

Dessa forma, um ambiente novo pode ser iniciado apenas com:

```powershell
docker compose up --build
```

sem necessidade de executar `dotnet ef database update` manualmente.

---

## Migrations

Acesse a pasta do backend:

```powershell
cd backend
```

Caso `dotnet-ef` ainda não esteja instalado:

```powershell
dotnet tool install --global dotnet-ef
```

Para aplicar as migrations:

```powershell
dotnet ef database update --project OrderManagement.Infrastructure --startup-project OrderManagement.Api
```

---

## Executando o backend manualmente

```powershell
cd backend
dotnet restore
dotnet build
dotnet run --project OrderManagement.Api
```

No ambiente utilizado durante o desenvolvimento:

```text
http://localhost:5205
```

Swagger:

```text
http://localhost:5205/swagger
```

A porta pode variar conforme o `launchSettings.json`.

---

## Executando o frontend manualmente

```powershell
cd frontend
npm install
```

Configure o arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5205/api
```

Execute:

```powershell
npm run dev
```

Frontend:

```text
http://localhost:3000
```

Para validar o build de produção:

```powershell
npm run build
```

---

# Funcionalidades

## Produtos

A aplicação permite:

- cadastrar produto;
- consultar produto por ID;
- listar produtos;
- editar produto;
- ativar e inativar produto;
- consultar estoque;
- pesquisar por nome;
- filtrar por status;
- ordenar resultados;
- paginar os resultados.

Campos principais:

```text
Id
Nome
Descrição
Preço
Quantidade em estoque
Status
Data de criação
```

### Regras de produto

- o nome é obrigatório;
- o preço deve ser maior que zero;
- o estoque não pode ser negativo;
- produtos inativos não podem ser usados em novos pedidos;
- a edição convencional do produto não altera diretamente o estoque;
- não existe exclusão física de produto, sendo utilizado o status Ativo/Inativo.

---

## Pedidos

A aplicação permite:

- criar pedido;
- consultar pedido por ID;
- listar pedidos;
- filtrar pedidos;
- consultar detalhes;
- atualizar status;
- cancelar pedido.

Campos principais:

```text
Id
Data de criação
Data de atualização
Status
Valor dos produtos
Desconto
Valor total
Itens
```

Cada item contém:

```text
Produto
Quantidade
Preço unitário
Valor total
```

### Regras de pedido

- o pedido deve possuir pelo menos um item;
- a quantidade de cada item deve ser maior que zero;
- produto inexistente não pode ser utilizado;
- produto inativo não pode ser utilizado;
- a quantidade solicitada não pode ultrapassar o estoque disponível;
- o estoque só é atualizado quando o pedido é efetivamente criado;
- os valores definitivos são calculados no backend.

---

## Snapshot de preço

O preço do produto é armazenado no item no momento da criação do pedido.

Exemplo:

```text
Produto no momento da compra: R$ 100,00
Pedido criado:                R$ 100,00

Produto alterado depois:      R$ 150,00

Pedido antigo continua:       R$ 100,00
```

Assim, mudanças futuras no preço do produto não alteram pedidos históricos.

---

## Cálculo do pedido

O frontend envia apenas os produtos e quantidades.

Exemplo:

```json
{
  "itens": [
    {
      "produtoId": 1,
      "quantidade": 2
    }
  ]
}
```

O backend calcula novamente:

- preço unitário;
- subtotal;
- desconto;
- valor total.

O frontend apresenta apenas uma estimativa.

---

## Regra de desconto

A regra adotada é baseada na quantidade total de unidades do pedido:

```text
Até 5 unidades   → 0%
De 6 a 10        → 5%
Acima de 10      → 10%
```

Exemplo:

```text
6 unidades de R$ 100,00

Subtotal: R$ 600,00
Desconto: R$ 30,00
Total:    R$ 570,00
```

A regra está centralizada no backend.

---

## Status do pedido

Status disponíveis:

```text
1 = Pendente
2 = Processando
3 = Concluído
4 = Cancelado
```

Transições permitidas:

```text
Pendente
├── Processando
└── Cancelado

Processando
├── Concluído
└── Cancelado
```

`Concluído` e `Cancelado` são estados finais.

Transições inválidas são rejeitadas pelo backend.

---

## Cancelamento

Ao cancelar um pedido:

- o status é alterado para `Cancelado`;
- o estoque dos itens é devolvido;
- a alteração é realizada dentro de transação;
- o frontend exige confirmação antes do cancelamento.

---

# Concorrência e estoque

A reserva de estoque é feita de maneira atômica diretamente no banco.

Conceitualmente:

```sql
Update Produtos
Set QuantidadeEstoque = QuantidadeEstoque - @Quantidade
Where Id = @ProdutoId
And QuantidadeEstoque >= @Quantidade
```

Se nenhuma linha for atualizada, a operação é rejeitada.

Exemplo:

```text
Estoque = 1

Usuário A tenta comprar 1
Usuário B tenta comprar 1

Apenas uma operação consegue reservar o estoque.
A outra é rejeitada.
O estoque nunca fica negativo.
```

---

## Concorrência na alteração de status

A mudança de status também é condicional.

Conceitualmente:

```sql
Update Pedidos
Set Status = @NovoStatus
Where Id = @PedidoId
And Status = @StatusAnterior
```

Se outra operação já tiver alterado o status, nenhuma linha será afetada e a tentativa é rejeitada.

---

# Transações

A criação do pedido acontece dentro de uma transação.

Fluxo principal:

```text
Criar pedido
    ↓
Registrar idempotência
    ↓
Reservar estoque
    ↓
Criar itens
    ↓
Calcular valores
    ↓
Salvar
    ↓
Commit
```

Em caso de falha:

```text
Rollback
```

Isso evita:

- pedido parcialmente criado;
- estoque reduzido sem pedido;
- pedido sem itens;
- inconsistências de dados.

---

# Idempotência

A criação de pedidos utiliza o header:

```http
Idempotency-Key
```

Exemplo:

```http
POST /api/Pedidos
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```

A aplicação persiste:

```text
Chave
Hash da requisição
Pedido associado
Data de criação
```

O hash é gerado com SHA-256 a partir dos itens da requisição.

### Retry da mesma operação

Se uma requisição for processada, mas a resposta se perder por timeout ou falha de rede, o cliente pode repetir a chamada com a mesma chave.

Se o conteúdo for o mesmo:

```text
mesma chave
+
mesma requisição
=
retorna o pedido já criado
```

Nenhum novo pedido é criado e o estoque não é reduzido novamente.

### Reutilização inválida

Se a mesma chave for utilizada com conteúdo diferente, a operação é rejeitada.

Exemplo:

```text
Chave ABC
Produto 1 × 2
```

Depois:

```text
Chave ABC
Produto 1 × 3
```

Resultado:

```text
Operação rejeitada
```

### Idempotência no frontend

O frontend gera a chave utilizando:

```text
crypto.randomUUID()
```

A chave e o rascunho do novo pedido são persistidos temporariamente no:

```text
sessionStorage
```

Assim, em caso de timeout, falha de rede ou refresh da página, a mesma chave pode ser reutilizada.

Quando os itens do pedido são modificados, a chave anterior é invalidada.

---

# Tratamento de erros

A API utiliza middleware global para padronizar os erros.

Exemplo:

```json
{
  "message": "Mensagem do erro",
  "code": "BUSINESS_RULE_VIOLATION",
  "traceId": "identificador-da-requisicao"
}
```

Principais categorias:

```text
400 → VALIDATION_ERROR
404 → recurso não encontrado
409 → BUSINESS_RULE_VIOLATION
500 → INTERNAL_ERROR
```

Informações sensíveis e detalhes internos não são retornados ao cliente.

---

# API

## Produtos

### Listar

```http
GET /api/Produtos
```

Exemplo:

```http
GET /api/Produtos?pagina=1&tamanhoPagina=50&nome=Mouse&status=1&ordenarPor=nome&direcao=asc
```

### Consultar por ID

```http
GET /api/Produtos/{id}
```

### Criar

```http
POST /api/Produtos
```

Body:

```json
{
  "nome": "Notebook",
  "descricao": "Notebook para desenvolvimento",
  "preco": 3500,
  "quantidadeEstoque": 10
}
```

### Atualizar

```http
PUT /api/Produtos/{id}
```

Body:

```json
{
  "nome": "Notebook Pro",
  "descricao": "Notebook atualizado",
  "preco": 4200,
  "status": 1
}
```

### Status de produto

```text
1 = Ativo
2 = Inativo
```

---

## Pedidos

### Listar

```http
GET /api/Pedidos
```

Filtros disponíveis:

- status;
- data inicial;
- data final;
- valor mínimo;
- valor máximo.

### Consultar por ID

```http
GET /api/Pedidos/{id}
```

### Criar

```http
POST /api/Pedidos
```

Header:

```http
Idempotency-Key: identificador-unico
```

Body:

```json
{
  "itens": [
    {
      "produtoId": 1,
      "quantidade": 2
    },
    {
      "produtoId": 2,
      "quantidade": 1
    }
  ]
}
```

### Atualizar status

```http
PUT /api/Pedidos/{id}/status
```

Body:

```json
{
  "status": 2
}
```

---

# Frontend

O frontend utiliza o Pages Router do Next.js.

Rotas principais:

```text
/
├── /produtos
├── /produtos/novo
├── /produtos/[id]
├── /pedidos
├── /pedidos/novo
└── /pedidos/[id]
```

## Tela de produtos

Possui:

- listagem;
- busca por nome;
- filtro por status;
- ordenação;
- paginação;
- cadastro;
- edição;
- ativação/inativação.

## Tela de novo pedido

Possui:

- busca de produtos;
- seleção de produto;
- quantidade;
- validação contra estoque conhecido;
- adição e remoção de itens;
- subtotal estimado;
- desconto estimado;
- total estimado;
- criação do pedido;
- idempotência;
- recuperação do rascunho após refresh.

## Tela de pedidos

Possui:

- listagem;
- paginação;
- filtro por status;
- filtro por período;
- filtro por valor;
- acesso aos detalhes.

## Detalhes do pedido

Apresenta:

- status;
- data de criação;
- data de atualização;
- itens;
- preço utilizado no pedido;
- subtotal;
- desconto;
- total;
- ações disponíveis conforme o status.

O cancelamento exige confirmação do usuário.

---

# Testes automatizados

Os testes utilizam:

- xUnit;
- Moq;
- SQL Server LocalDB para teste de integração.

Executar:

```powershell
cd backend
dotnet test
```

A suíte atual possui:

```text
31 testes aprovados
```

Principais cenários cobertos:

- validações de produto;
- criação de produto;
- atualização de produto;
- paginação;
- validações de pedido;
- produto inexistente;
- produto inativo;
- estoque insuficiente;
- cálculo sem desconto;
- desconto de 5%;
- desconto de 10%;
- transições válidas de status;
- transições inválidas;
- cancelamento;
- devolução de estoque;
- concorrência de status;
- idempotência;
- reutilização inválida da chave;
- rollback por falha de estoque;
- concorrência real de estoque no SQL Server.

---

## Teste de concorrência real

Existe um teste de integração que cria um banco temporário no SQL Server LocalDB.

O teste cria:

```text
Produto
Estoque = 1
```

Depois executa duas reservas concorrentes utilizando dois `DbContext` independentes.

Resultado esperado:

```text
1 operação = sucesso
1 operação = falha
estoque final = 0
```

O banco temporário é removido ao final do teste.

---

# Decisões técnicas

## Produto não é excluído fisicamente

Foi adotado `Ativo/Inativo` para preservar referências históricas e evitar problemas com pedidos existentes.

## Estoque não é editado junto com os demais dados do produto

Após o cadastro inicial, alterações de estoque são controladas pelo fluxo de pedidos.

## Valores definitivos são calculados no backend

O frontend nunca é considerado autoridade para preço, desconto ou total.

## Concorrência é protegida no banco

A validação de estoque não depende somente de dados carregados em memória. A reserva é feita de forma atômica no SQL Server.

## Idempotência é persistida

A chave de idempotência é armazenada no banco com restrição única, permitindo proteção entre requisições diferentes.

## Pedidos não são editados após a criação

Após a criação, itens, quantidades, preços e valores do pedido não podem ser alterados.

A única alteração permitida é a evolução do status conforme a máquina de estados da aplicação.

Essa decisão preserva o histórico da operação e evita que alterações posteriores modifiquem estoque, valores ou condições existentes no momento da criação do pedido.

---

# Limitações atuais

Considerando o escopo do projeto:

- não existe autenticação ou autorização;
- não existe histórico completo de alterações de status;
- não existe tela específica para movimentação manual de estoque;
- a execução manual utiliza SQL Server/LocalDB e a execução containerizada utiliza SQL Server 2022;
- cada consulta de produtos retorna no máximo 50 resultados;
- o `sessionStorage` é limitado à sessão da aba;
- não existe mensageria;
- não existe cache;
- não existe observabilidade distribuída.

---

# Melhorias futuras

Possíveis evoluções:

- autenticação e autorização;
- perfis de acesso;
- histórico de status;
- auditoria de movimentação de estoque;
- endpoint específico para ajuste de estoque;
- testes end-to-end;
- Testcontainers;
- logs estruturados;
- OpenTelemetry;
- health checks;
- CI/CD;
- GitHub Actions;
- cache;
- melhorias de responsividade e UX.

---

# Validação do projeto

Backend:

```powershell
cd backend
dotnet build
dotnet test
```

Frontend:

```powershell
cd frontend
npm install
npm run build
```

Docker, a partir da raiz do repositório:

```powershell
docker compose up --build
```

Resultado obtido durante o desenvolvimento:

```text
Backend
31 testes automatizados aprovados

Frontend
TypeScript aprovado
Build de produção aprovado
Todas as páginas geradas com sucesso

Docker
Imagem do backend construída com sucesso
Imagem do frontend construída com sucesso
SQL Server iniciado em container
Migrations aplicadas automaticamente
Aplicação executada com Docker Compose
```

---

# Autor

Desenvolvido por Nickson.
