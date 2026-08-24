import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ApiError } from "@/services/api";
import {
  atualizarProduto,
  obterProdutoPorId
} from "@/services/produtosService";
import { StatusProduto } from "@/types/produto";

export default function EditarProdutoPage() {
  const router = useRouter();

  const { id } = router.query;

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [status, setStatus] = useState<StatusProduto>(
    StatusProduto.Ativo
  );

  const [estoque, setEstoque] = useState(0);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const produtoId = Number(id);

    if (!Number.isInteger(produtoId) ||
        produtoId <= 0) {
      setErro("Produto inválido.");
      setCarregando(false);

      return;
    }

    async function carregarProduto() {
      try {
        setCarregando(true);
        setErro("");

        const produto =
          await obterProdutoPorId(produtoId);

        setNome(produto.nome);
        setDescricao(produto.descricao);
        setPreco(produto.preco.toString());
        setEstoque(produto.quantidadeEstoque);
        setStatus(produto.status);
      } catch (error) {
        if (error instanceof ApiError) {
          setErro(error.message);
        } else {
          setErro(
            "Não foi possível carregar o produto."
          );
        }
      } finally {
        setCarregando(false);
      }
    }

    carregarProduto();
  }, [router.isReady, id]);

  async function salvar(event: FormEvent) {
    event.preventDefault();

    setErro("");

    const produtoId = Number(id);

    const precoNumero = Number(
      preco.replace(",", ".")
    );

    if (!nome.trim()) {
      setErro("Informe o nome do produto.");

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

    try {
      setSalvando(true);

      await atualizarProduto(
        produtoId,
        {
          nome: nome.trim(),
          descricao: descricao.trim(),
          preco: precoNumero,
          status
        }
      );

      await router.push("/produtos");
    } catch (error) {
      if (error instanceof ApiError) {
        setErro(error.message);
      } else {
        setErro(
          "Não foi possível atualizar o produto."
        );
      }
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <p>
        Carregando produto...
      </p>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Editar Produto</h1>

          <p>
            Atualize os dados e o status do produto.
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
            <label htmlFor="estoque">
              Estoque atual
            </label>

            <input
              id="estoque"
              type="number"
              value={estoque}
              disabled
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="status">
            Status
          </label>

          <select
            id="status"
            value={status}
            onChange={(event) =>
              setStatus(
                Number(event.target.value) as StatusProduto
              )
            }
            disabled={salvando}
          >
            <option value={StatusProduto.Ativo}>
              Ativo
            </option>

            <option value={StatusProduto.Inativo}>
              Inativo
            </option>
          </select>
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
              : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </>
  );
}