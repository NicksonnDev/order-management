import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ApiError } from "@/services/api";
import { criarProduto } from "@/services/produtosService";

export default function NovoProdutoPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [quantidadeEstoque, setQuantidadeEstoque] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar(event: FormEvent) {
    event.preventDefault();

    setErro("");

    const precoNumero = Number(
      preco.replace(",", ".")
    );

    const estoqueNumero = Number(
      quantidadeEstoque
    );

    if (!nome.trim()) {
      setErro(
        "Informe o nome do produto."
      );

      return;
    }

    if (
      !Number.isFinite(precoNumero) ||
      precoNumero <= 0
    ) {
      setErro(
        "Informe um preço válido maior que zero."
      );

      return;
    }

    if (
      !Number.isInteger(estoqueNumero) ||
      estoqueNumero < 0
    ) {
      setErro(
        "Informe uma quantidade de estoque válida."
      );

      return;
    }

    try {
      setSalvando(true);

      await criarProduto({
        nome: nome.trim(),
        descricao: descricao.trim(),
        preco: precoNumero,
        quantidadeEstoque: estoqueNumero
      });

      await router.push("/produtos");
    } catch (error) {
      if (error instanceof ApiError) {
        setErro(error.message);
      } else {
        setErro(
          "Não foi possível cadastrar o produto."
        );
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Novo Produto</h1>

          <p>
            Cadastre um novo produto e seu estoque inicial.
          </p>
        </div>

        <Link
          href="/produtos"
          className="button-secondary"
        >
          Voltar
        </Link>
      </div>

      <form
        onSubmit={salvar}
        className="form-card"
      >
        {erro && (
          <div className="alert-error">
            {erro}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="nome">
            Nome
          </label>

          <input
            id="nome"
            type="text"
            maxLength={200}
            value={nome}
            onChange={(event) =>
              setNome(event.target.value)
            }
            disabled={salvando}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="descricao">
            Descrição
          </label>

          <textarea
            id="descricao"
            maxLength={1000}
            rows={5}
            value={descricao}
            onChange={(event) =>
              setDescricao(event.target.value)
            }
            disabled={salvando}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="preco">
              Preço
            </label>

            <input
              id="preco"
              type="number"
              min="0.01"
              step="0.01"
              value={preco}
              onChange={(event) =>
                setPreco(event.target.value)
              }
              disabled={salvando}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="quantidadeEstoque">
              Estoque inicial
            </label>

            <input
              id="quantidadeEstoque"
              type="number"
              min="0"
              step="1"
              value={quantidadeEstoque}
              onChange={(event) =>
                setQuantidadeEstoque(
                  event.target.value
                )
              }
              disabled={salvando}
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <Link
            href="/produtos"
            className="button-secondary"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            className="button-primary"
            disabled={salvando}
          >
            {salvando
              ? "Salvando..."
              : "Salvar Produto"}
          </button>
        </div>
      </form>
    </>
  );
}