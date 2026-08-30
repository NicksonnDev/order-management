import {
    FormEvent,
    useEffect,
    useState
} from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
    ArrowLeft,
    Boxes,
    PackageCheck,
    Save
} from "lucide-react";
import { ApiError } from "@/services/api";
import {
    atualizarProduto,
    obterProdutoPorId
} from "@/services/produtosService";
import {
    Produto,
    StatusProduto
} from "@/types/produto";
import PageHeader from "@/components/ui/PageHeader";

export default function EditarProdutoPage() {
    const router = useRouter();

    const { id } = router.query;

    const [produto, setProduto] =
        useState<Produto | null>(null);

    const [nome, setNome] =
        useState("");

    const [descricao, setDescricao] =
        useState("");

    const [preco, setPreco] =
        useState("");

    const [status, setStatus] =
        useState<StatusProduto>(
            StatusProduto.Ativo
        );

    const [carregando, setCarregando] =
        useState(true);

    const [salvando, setSalvando] =
        useState(false);

    const [erro, setErro] =
        useState("");

    useEffect(() => {
        if (!router.isReady) {
            return;
        }

        const produtoId = Number(id);

        if (
            !Number.isInteger(produtoId) ||
            produtoId <= 0
        ) {
            return;
        }

        let cancelado = false;

        obterProdutoPorId(produtoId)
            .then((resultado) => {
                if (cancelado) {
                    return;
                }

                setProduto(resultado);
                setNome(resultado.nome);
                setDescricao(resultado.descricao ?? "");
                setPreco(resultado.preco.toString());
                setStatus(resultado.status);
                setErro("");
            })
            .catch((error) => {
                if (cancelado) {
                    return;
                }

                if (error instanceof ApiError) {
                    setErro(error.message);
                } else {
                    setErro(
                        "Não foi possível carregar o produto."
                    );
                }
            })
            .finally(() => {
                if (!cancelado) {
                    setCarregando(false);
                }
            });

        return () => {
            cancelado = true;
        };
    }, [
        router.isReady,
        id
    ]);


    async function salvarProduto(
        event: FormEvent
    ) {
        event.preventDefault();

        if (!produto) {
            return;
        }

        setErro("");

        const precoNumero =
            Number(preco);

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

        try {
            setSalvando(true);

            await atualizarProduto(
                produto.id,
                {
                    nome:
                        nome.trim(),

                    descricao:
                        descricao.trim(),

                    preco:
                        precoNumero,

                    status
                }
            );

            await router.push(
                "/produtos"
            );
        } catch (error) {
            if (error instanceof ApiError) {
                setErro(
                    error.message
                );
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
            <div className="page-loading">
                <div className="spinner" />

                <span>
                    Carregando produto...
                </span>
            </div>
        );
    }

    if (erro && !produto) {
        return (
            <>
                <div className="alert-error">
                    {erro}
                </div>

                <Link
                    href="/produtos"
                    className="button-secondary"
                >
                    <ArrowLeft size={16} />

                    Voltar
                </Link>
            </>
        );
    }

    if (!produto) {
        return null;
    }

    return (
        <>
            <PageHeader
                title="Editar produto"
                description={`Produto #${produto.id}`}
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
                            <PackageCheck size={19} />
                        </div>

                        <div>
                            <h2>
                                Informações básicas
                            </h2>

                            <p>
                                Atualize os dados principais
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
                                Comercial e disponibilidade
                            </h2>

                            <p>
                                Gerencie o preço e a disponibilidade
                                do produto para novos pedidos.
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
                                        disabled={salvando}
                                    />
                                </div>

                                <small>
                                    Pedidos antigos mantêm
                                    o preço original.
                                </small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="status">
                                    Status

                                    <span className="required-mark">
                                        *
                                    </span>
                                </label>

                                <select
                                    id="status"
                                    value={status}
                                    onChange={(event) =>
                                        setStatus(
                                            Number(
                                                event.target.value
                                            ) as StatusProduto
                                        )
                                    }
                                    disabled={salvando}
                                >
                                    <option
                                        value={
                                            StatusProduto.Ativo
                                        }
                                    >
                                        Ativo
                                    </option>

                                    <option
                                        value={
                                            StatusProduto.Inativo
                                        }
                                    >
                                        Inativo
                                    </option>
                                </select>

                                <small>
                                    Produtos inativos não podem
                                    ser incluídos em novos pedidos.
                                </small>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="form-section-card">
                    <div className="form-section-header">
                        <div className="form-section-icon">
                            <Boxes size={19} />
                        </div>

                        <div>
                            <h2>
                                Estoque
                            </h2>

                            <p>
                                Consulte a quantidade atualmente
                                disponível.
                            </p>
                        </div>
                    </div>

                    <div className="form-section-body">
                        <div className="stock-readonly-card">
                            <div>
                                <span>
                                    Quantidade disponível
                                </span>

                                <strong>
                                    {
                                        produto.quantidadeEstoque
                                    }
                                </strong>

                                <small>
                                    {produto.quantidadeEstoque === 1
                                        ? "unidade em estoque"
                                        : "unidades em estoque"}
                                </small>
                            </div>

                            <div className="stock-readonly-info">
                                O estoque não pode ser alterado
                                diretamente nesta tela. As
                                movimentações são controladas
                                pelo fluxo de pedidos.
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
                                : "Salvar alterações"}
                        </button>
                    </div>
                </div>
            </form>
        </>
    );
}