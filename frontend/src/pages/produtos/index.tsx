import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ApiError } from "@/services/api";
import { listarProdutos } from "@/services/produtosService";
import { Produto, StatusProduto } from "@/types/produto";

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);

  const [nome, setNome] = useState("");
  const [nomeFiltro, setNomeFiltro] = useState("");

  const [status, setStatus] = useState<StatusProduto | undefined>();

  const [ordenarPor, setOrdenarPor] = useState("nome");

  const [direcao, setDirecao] = useState<"asc" | "desc">("asc");

  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalItens, setTotalItens] = useState(0);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregarProdutos() {
    try {
      setCarregando(true);
      setErro("");

      const resultado = await listarProdutos({
        pagina,
        tamanhoPagina: 50,
        nome: nomeFiltro || undefined,
        status,
        ordenarPor,
        direcao
      });

      setProdutos(resultado.itens);
      setTotalPaginas(resultado.totalPaginas);
      setTotalItens(resultado.totalItens);
    } catch (error) {
      if (error instanceof ApiError) {
        setErro(error.message);
      } else {
        setErro("Não foi possível carregar os produtos.");
      }
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarProdutos();
  }, [
    pagina,
    nomeFiltro,
    status,
    ordenarPor,
    direcao
  ]);

  function pesquisar(event: FormEvent) {
    event.preventDefault();

    setPagina(1);
    setNomeFiltro(nome.trim());
  }

  function limparFiltros() {
    setNome("");
    setNomeFiltro("");
    setStatus(undefined);
    setOrdenarPor("nome");
    setDirecao("asc");
    setPagina(1);
  }

  return (
    <>
      <h1>Produtos</h1>

      <div className="page-actions">
        <Link
          href="/produtos/novo"
          className="button-primary"
        >
          Novo Produto
        </Link>
      </div>

      <form
        onSubmit={pesquisar}
        className="filters"
      >
        <div className="form-group">
          <label htmlFor="nome">
            Nome
          </label>

          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(event) =>
              setNome(event.target.value)
            }
            placeholder="Buscar produto"
          />
        </div>

        <div className="form-group">
          <label htmlFor="status">
            Status
          </label>

          <select
            id="status"
            value={status ?? ""}
            onChange={(event) => {
              const valor = event.target.value;

              setStatus(
                valor
                  ? Number(valor) as StatusProduto
                  : undefined
              );

              setPagina(1);
            }}
          >
            <option value="">
              Todos
            </option>

            <option value={StatusProduto.Ativo}>
              Ativo
            </option>

            <option value={StatusProduto.Inativo}>
              Inativo
            </option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="ordenarPor">
            Ordenar por
          </label>

          <select
            id="ordenarPor"
            value={ordenarPor}
            onChange={(event) => {
              setOrdenarPor(event.target.value);
              setPagina(1);
            }}
          >
            <option value="nome">
              Nome
            </option>

            <option value="preco">
              Preço
            </option>

            <option value="estoque">
              Estoque
            </option>

            <option value="status">
              Status
            </option>

            <option value="datacriacao">
              Data de criação
            </option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="direcao">
            Direção
          </label>

          <select
            id="direcao"
            value={direcao}
            onChange={(event) => {
              setDirecao(
                event.target.value as "asc" | "desc"
              );

              setPagina(1);
            }}
          >
            <option value="asc">
              Crescente
            </option>

            <option value="desc">
              Decrescente
            </option>
          </select>
        </div>

        <button type="submit">
          Pesquisar
        </button>

        <button
          type="button"
          onClick={limparFiltros}
        >
          Limpar
        </button>
      </form>

      <p>
        Total de produtos: {totalItens}
      </p>

      {carregando && (
        <p>Carregando produtos...</p>
      )}

      {erro && (
        <p>{erro}</p>
      )}

      {!carregando &&
        !erro &&
        produtos.length === 0 && (
          <p>
            Nenhum produto encontrado.
          </p>
        )}

      {!carregando &&
        !erro &&
        produtos.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Id</th>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Status</th>
                <th>Data de criação</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {produtos.map((produto) => (
                <tr key={produto.id}>
                  <td>{produto.id}</td>

                  <td>{produto.nome}</td>

                  <td>{produto.descricao}</td>

                  <td>
                    {produto.preco.toLocaleString(
                      "pt-BR",
                      {
                        style: "currency",
                        currency: "BRL"
                      }
                    )}
                  </td>

                  <td>
                    {produto.quantidadeEstoque}
                  </td>

                  <td>
                    {produto.status === StatusProduto.Ativo
                      ? "Ativo"
                      : "Inativo"}
                  </td>

                  <td>
                    {new Date(
                      produto.dataCriacao
                    ).toLocaleString("pt-BR")}
                  </td>

                    <td>
                      <Link
                        href={`/produtos/${produto.id}`}
                        className="table-link"
                        >
                        Editar
                      </Link>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

      {!carregando &&
        !erro &&
        totalPaginas > 0 && (
          <div className="pagination">
            <button
              type="button"
              disabled={pagina <= 1}
              onClick={() =>
                setPagina((atual) => atual - 1)
              }
            >
              Anterior
            </button>

            <span>
              Página {pagina} de {totalPaginas}
            </span>

            <button
              type="button"
              disabled={pagina >= totalPaginas}
              onClick={() =>
                setPagina((atual) => atual + 1)
              }
            >
              Próxima
            </button>
          </div>
        )}
    </>
  );
}