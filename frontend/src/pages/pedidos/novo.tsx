import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ApiError } from "@/services/api";
import { criarPedido } from "@/services/pedidosService";
import { listarProdutos } from "@/services/produtosService";
import { Produto, StatusProduto } from "@/types/produto";
import { ItemCriarPedidoRequest } from "@/types/pedido";

interface ItemTela {
  produto: Produto;
  quantidade: number;
}

const CHAVE_ITENS_PEDIDO =
  "order-management:novo-pedido:itens";

const CHAVE_IDEMPOTENCIA =
  "order-management:novo-pedido:idempotencia";

export default function NovoPedidoPage() {
  const router = useRouter();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [itens, setItens] = useState<ItemTela[]>([]);

  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidade, setQuantidade] = useState("1");

  const [carregandoProdutos, setCarregandoProdutos] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [chaveIdempotencia, setChaveIdempotencia] =
    useState("");

  const [rascunhoCarregado, setRascunhoCarregado] =
    useState(false);

  const [buscaProduto, setBuscaProduto] =
    useState("");

  const [filtroProduto, setFiltroProduto] =
    useState("");

  useEffect(() => {
    async function carregarProdutos() {
      try {
        setCarregandoProdutos(true);
        setErro("");

        const resultado = await listarProdutos({
          pagina: 1,
          tamanhoPagina: 50,
          nome: filtroProduto || undefined,
          status: StatusProduto.Ativo,
          ordenarPor: "nome",
          direcao: "asc"
        });

        setProdutos(resultado.itens);
      } catch (error) {
        if (error instanceof ApiError) {
          setErro(error.message);
        } else {
          setErro(
            "Não foi possível carregar os produtos."
          );
        }
      } finally {
        setCarregandoProdutos(false);
      }
    }

    carregarProdutos();
}, [filtroProduto]);

  useEffect(() => {
    const itensSalvos =
      sessionStorage.getItem(
        CHAVE_ITENS_PEDIDO
      );

    const chaveSalva =
      sessionStorage.getItem(
        CHAVE_IDEMPOTENCIA
      );

    if (itensSalvos) {
      try {
        const itensRascunho =
          JSON.parse(itensSalvos) as ItemTela[];

        setItens(itensRascunho);
      } catch {
        sessionStorage.removeItem(
          CHAVE_ITENS_PEDIDO
        );
      }
    }

    if (chaveSalva) {
      setChaveIdempotencia(
        chaveSalva
      );
    }

    setRascunhoCarregado(true);
  }, []);

  useEffect(() => {
    if (!rascunhoCarregado) {
      return;
    }

    if (itens.length === 0) {
      sessionStorage.removeItem(
        CHAVE_ITENS_PEDIDO
      );

      return;
    }

    sessionStorage.setItem(
      CHAVE_ITENS_PEDIDO,
      JSON.stringify(itens)
    );
  }, [
    itens,
    rascunhoCarregado
  ]);

  const valorProdutos = useMemo(() => {
    return itens.reduce(
      (total, item) =>
        total +
        item.produto.preco *
          item.quantidade,
      0
    );
  }, [itens]);

  const quantidadeTotal = useMemo(() => {
    return itens.reduce(
      (total, item) =>
        total + item.quantidade,
      0
    );
  }, [itens]);

  const desconto = useMemo(() => {
    if (quantidadeTotal > 10) {
      return valorProdutos * 0.10;
    }

    if (quantidadeTotal > 5) {
      return valorProdutos * 0.05;
    }

    return 0;
  }, [
    quantidadeTotal,
    valorProdutos
  ]);

  const valorTotal =
    valorProdutos - desconto;

  function invalidarChaveIdempotencia() {
    setChaveIdempotencia("");

    sessionStorage.removeItem(
      CHAVE_IDEMPOTENCIA
    );
  }

  function pesquisarProduto() {
  setFiltroProduto(
    buscaProduto.trim()
  );

  setProdutoSelecionado("");
}

function limparBuscaProduto() {
  setBuscaProduto("");
  setFiltroProduto("");
  setProdutoSelecionado("");
}
  function adicionarItem() {
    setErro("");

    const produtoId =
      Number(produtoSelecionado);

    const quantidadeNumero =
      Number(quantidade);

    const produto =
      produtos.find(
        (item) =>
          item.id === produtoId
      );

    if (!produto) {
      setErro(
        "Selecione um produto."
      );

      return;
    }

    if (
      !Number.isInteger(quantidadeNumero) ||
      quantidadeNumero <= 0
    ) {
      setErro(
        "Informe uma quantidade válida."
      );

      return;
    }

    const itemExistente =
      itens.find(
        (item) =>
          item.produto.id === produto.id
      );

    const quantidadeAtual =
      itemExistente?.quantidade ?? 0;

    const novaQuantidade =
      quantidadeAtual +
      quantidadeNumero;

    if (
      novaQuantidade >
      produto.quantidadeEstoque
    ) {
      setErro(
        `A quantidade informada ultrapassa o estoque disponível de ${produto.quantidadeEstoque}.`
      );

      return;
    }

    if (itemExistente) {
      setItens(
        itens.map((item) =>
          item.produto.id === produto.id
            ? {
                ...item,
                quantidade:
                  novaQuantidade
              }
            : item
        )
      );
    } else {
      setItens([
        ...itens,
        {
          produto,
          quantidade:
            quantidadeNumero
        }
      ]);
    }

    invalidarChaveIdempotencia();

    setProdutoSelecionado("");
    setQuantidade("1");
  }

  function removerItem(
    produtoId: number
  ) {
    setItens(
      itens.filter(
        (item) =>
          item.produto.id !== produtoId
      )
    );

    invalidarChaveIdempotencia();
  }

  async function salvarPedido() {
    if (itens.length === 0) {
      setErro(
        "Adicione pelo menos um item ao pedido."
      );

      return;
    }

    try {
      setSalvando(true);
      setErro("");

      const itensRequest:
        ItemCriarPedidoRequest[] =
        itens.map((item) => ({
          produtoId: item.produto.id,
          quantidade: item.quantidade
        }));

      let chave =
        chaveIdempotencia ||
        sessionStorage.getItem(
          CHAVE_IDEMPOTENCIA
        ) ||
        "";

      if (!chave) {
        chave =
          crypto.randomUUID();

        setChaveIdempotencia(
          chave
        );

        sessionStorage.setItem(
          CHAVE_IDEMPOTENCIA,
          chave
        );
      }

      const pedido =
        await criarPedido(
          {
            itens: itensRequest
          },
          chave
        );

      sessionStorage.removeItem(
        CHAVE_ITENS_PEDIDO
      );

      sessionStorage.removeItem(
        CHAVE_IDEMPOTENCIA
      );

      setChaveIdempotencia("");

      await router.push(
        `/pedidos/${pedido.id}`
      );
    } catch (error) {
      if (error instanceof ApiError) {
        setErro(error.message);
      } else {
        setErro(
          "Não foi possível criar o pedido."
        );
      }
    } finally {
      setSalvando(false);
    }
  }

  function formatarMoeda(
    valor: number
  ) {
    return valor.toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL"
      }
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Novo Pedido</h1>

          <p>
            Selecione os produtos e informe
            as quantidades.
          </p>
        </div>

        <Link
          href="/pedidos"
          className="button-secondary"
        >
          Voltar
        </Link>
      </div>

      {erro && (
        <div className="alert-error">
          {erro}
        </div>
      )}

      <div className="form-card">
      <div className="product-search">
  <div className="form-group">
    <label htmlFor="buscaProduto">
      Buscar produto
    </label>

    <input
      id="buscaProduto"
      type="text"
      value={buscaProduto}
      onChange={(event) =>
        setBuscaProduto(
          event.target.value
        )
      }
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();

          pesquisarProduto();
        }
      }}
      placeholder="Digite o nome do produto"
      disabled={salvando}
    />
  </div>

  <button
    type="button"
    className="button-secondary"
    onClick={pesquisarProduto}
    disabled={
      carregandoProdutos ||
      salvando
    }
  >
    Buscar
  </button>

  {filtroProduto && (
    <button
      type="button"
      className="button-secondary"
      onClick={limparBuscaProduto}
      disabled={salvando}
    >
      Limpar Busca
    </button>
  )}
</div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="produto">
              Produto
            </label>

            <select
              id="produto"
              value={produtoSelecionado}
              onChange={(event) =>
                setProdutoSelecionado(
                  event.target.value
                )
              }
              disabled={
                carregandoProdutos ||
                salvando
              }
            >

            <option value="">
              {carregandoProdutos
                ? "Carregando produtos..."
                : produtos.length === 0
                  ? "Nenhum produto encontrado"
                  : "Selecione"}
            </option>

              {produtos.map(
                (produto) => (
                  <option
                    key={produto.id}
                    value={produto.id}
                  >
                    {produto.nome}
                    {" - "}
                    {formatarMoeda(
                      produto.preco
                    )}
                    {" - estoque "}
                    {
                      produto.quantidadeEstoque
                    }
                  </option>
                )
              )}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="quantidade">
              Quantidade
            </label>

            <input
              id="quantidade"
              type="number"
              min="1"
              step="1"
              value={quantidade}
              onChange={(event) =>
                setQuantidade(
                  event.target.value
                )
              }
              disabled={salvando}
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="button-primary"
            onClick={adicionarItem}
            disabled={
              carregandoProdutos ||
              salvando
            }
          >
            Adicionar Produto
          </button>
        </div>
      </div>

      <h2>Itens do Pedido</h2>

      {itens.length === 0 ? (
        <p>
          Nenhum item adicionado.
        </p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Quantidade</th>
              <th>Preço unitário</th>
              <th>Total</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {itens.map((item) => (
              <tr
                key={
                  item.produto.id
                }
              >
                <td>
                  {
                    item.produto.nome
                  }
                </td>

                <td>
                  {item.quantidade}
                </td>

                <td>
                  {formatarMoeda(
                    item.produto.preco
                  )}
                </td>

                <td>
                  {formatarMoeda(
                    item.produto.preco *
                      item.quantidade
                  )}
                </td>

                <td>
                  <button
                    type="button"
                    className="button-danger"
                    onClick={() =>
                      removerItem(
                        item.produto.id
                      )
                    }
                    disabled={salvando}
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="totals-card">
        <div>
          <span>
            Valor dos produtos
          </span>

          <strong>
            {formatarMoeda(
              valorProdutos
            )}
          </strong>
        </div>

        <div>
          <span>
            Desconto estimado
          </span>

          <strong>
            {formatarMoeda(
              desconto
            )}
          </strong>
        </div>

        <div className="total-final">
          <span>
            Total estimado
          </span>

          <strong>
            {formatarMoeda(
              valorTotal
            )}
          </strong>
        </div>
      </div>

      <div className="form-actions">
        <Link
          href="/pedidos"
          className="button-secondary"
        >
          Cancelar
        </Link>

        <button
          type="button"
          className="button-primary"
          disabled={
            salvando ||
            itens.length === 0
          }
          onClick={salvarPedido}
        >
          {salvando
            ? "Criando Pedido..."
            : "Criar Pedido"}
        </button>
      </div>
    </>
  );
}