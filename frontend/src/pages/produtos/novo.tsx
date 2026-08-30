import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
    ArrowLeft,
    PackagePlus,
    Save
} from "lucide-react";
import { ApiError } from "@/services/api";
import { criarProduto } from "@/services/produtosService";
import PageHeader from "@/components/ui/PageHeader";

export default function NovoProdutoPage() {
    const router = useRouter();

    const [nome, setNome] =
        useState("");

    const [descricao, setDescricao] =
        useState("");

    const [preco, setPreco] =
        useState("");

    const [quantidadeEstoque, setQuantidadeEstoque] =
        useState("0");

    const [salvando, setSalvando] =
        useState(false);

    const [erro, setErro] =
        useState("");

    async function salvarProduto(
        event: FormEvent
    ) {
        event.preventDefault();

        setErro("");

        const precoNumero =
            Number(preco);

        const estoqueNumero =
            Number(quantidadeEstoque);

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
                "Informe um preço válido."
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
                descricao:
                    descricao.trim(),
                preco: precoNumero,
                quantidadeEstoque:
                    estoqueNumero
            });

            await router.push(
                "/produtos"
            );
        } catch (error) {
            if (error instanceof ApiError) {
                setErro(error.message);
            } else {
                setErro(
                    "Não foi possível criar o produto."
                );
            }
        } finally {
            setSalvando(false);
        }
    }

    return (
        <>
            <PageHeader
                title="Novo produto"
                description="Cadastre um novo item no catálogo e defina seu estoque inicial."
                actions={
                    <Link
                        href="/produtos"
                        className="button-secondary"
                    >
                        <ArrowLeft size={16} />

                        Voltar
                    </Link>
                }
            />

            {erro && (
                <div className="alert-error">
                    {erro}
                </div>
            )}

            <form
                onSubmit={salvarProduto}
                className="entity-form"
            >
                <section className="form-section-card">
                    <div className="form-section-header">
                        <div className="form-section-icon">
                            <PackagePlus size={19} />
                        </div>

                        <div>
                            <h2>
                                Informações básicas
                            </h2>

                            <p>
                                Informe os dados principais
                                do produto.
                            </p>
                        </div>
                    </div>

                    <div className="form-section-body">
                        <div className="form-grid">
                            <div className="form-group form-group-full">
                                <label htmlFor="nome">
                                    Nome
                                    <span className="required-mark">
                                        *
                                    </span>
                                </label>

                                <input
                                    id="nome"
                                    type="text"
                                    maxLength={200}
                                    value={nome}
                                    onChange={(event) =>
                                        setNome(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Ex.: Notebook Dell Inspiron"
                                    disabled={salvando}
                                />

                                <small>
                                    Nome utilizado para identificar
                                    o produto no catálogo.
                                </small>
                            </div>

                            <div className="form-group form-group-full">
                                <label htmlFor="descricao">
                                    Descrição
                                </label>

                                <textarea
                                    id="descricao"
                                    maxLength={1000}
                                    rows={4}
                                    value={descricao}
                                    onChange={(event) =>
                                        setDescricao(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Descreva as principais características do produto"
                                    disabled={salvando}
                                />

                                <div className="field-footer">
                                    <small>
                                        Opcional
                                    </small>

                                    <small>
                                        {descricao.length}/1000
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="form-section-card">
                    <div className="form-section-header">
                        <div>
                            <h2>
                                Preço e estoque
                            </h2>

                            <p>
                                Defina o preço de venda e a
                                quantidade inicial disponível.
                            </p>
                        </div>
                    </div>

                    <div className="form-section-body">
                        <div className="form-grid form-grid-two">
                            <div className="form-group">
                                <label htmlFor="preco">
                                    Preço
                                    <span className="required-mark">
                                        *
                                    </span>
                                </label>

                                <div className="money-input">
                                    <span>
                                        R$
                                    </span>

                                    <input
                                        id="preco"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={preco}
                                        onChange={(event) =>
                                            setPreco(
                                                event.target.value
                                            )
                                        }
                                        placeholder="0,00"
                                        disabled={salvando}
                                    />
                                </div>

                                <small>
                                    O preço deve ser maior que zero.
                                </small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="estoque">
                                    Estoque inicial
                                    <span className="required-mark">
                                        *
                                    </span>
                                </label>

                                <input
                                    id="estoque"
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
                                />

                                <small>
                                    Após o cadastro, o estoque será
                                    controlado pelo fluxo de pedidos.
                                </small>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="form-submit-bar">
                    <div className="form-submit-info">
                        <span>
                            Campos com
                            <strong> *</strong>
                            {" "}são obrigatórios.
                        </span>
                    </div>

                    <div className="form-submit-actions">
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
                            <Save size={16} />

                            {salvando
                                ? "Salvando..."
                                : "Salvar produto"}
                        </button>
                    </div>
                </div>
            </form>
        </>
    );
}