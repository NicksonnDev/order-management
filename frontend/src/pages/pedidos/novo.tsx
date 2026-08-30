import {
    FormEvent,
    useEffect,
    useState
} from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
    ArrowLeft,
    Minus,
    PackageOpen,
    Plus,
    Search,
    ShoppingCart,
    Trash2
} from "lucide-react";
import { ApiError } from "@/services/api";
import {
    listarProdutos,
    obterProdutoPorId
} from "@/services/produtosService";
import { criarPedido } from "@/services/pedidosService";
import {
    Produto,
    StatusProduto
} from "@/types/produto";
import PageHeader from "@/components/ui/PageHeader";

interface ItemPedidoLocal {
    produto: Produto;
    quantidade: number;
}

interface ItemPedidoSalvo {
    produtoId: number;
    quantidade: number;
}

const STORAGE_ITENS =
    "order-management-novo-pedido-itens";

const STORAGE_IDEMPOTENCIA =
    "order-management-novo-pedido-idempotencia";

export default function NovoPedidoPage() {
    const router = useRouter();

    const [produtos, setProdutos] =
        useState<Produto[]>([]);

    const [itens, setItens] =
        useState<ItemPedidoLocal[]>([]);

    const [busca, setBusca] =
        useState("");

    const [buscaAplicada, setBuscaAplicada] =
        useState("");

    const [carregandoProdutos, setCarregandoProdutos] =
        useState(true);

    const [criandoPedido, setCriandoPedido] =
        useState(false);

    const [restaurando, setRestaurando] =
        useState(true);

    const [erro, setErro] =
        useState("");

    const [chaveIdempotencia, setChaveIdempotencia] =
        useState<string | null>(null);

        useEffect(() => {
    let cancelado = false;

    async function executarRestauracao() {
        /*
         * Garante que as alterações de estado
         * ocorram de forma assíncrona ao effect.
         */
        await Promise.resolve();

        try {
            const chaveSalva =
                sessionStorage.getItem(
                    STORAGE_IDEMPOTENCIA
                );

            if (
                chaveSalva &&
                !cancelado
            ) {
                setChaveIdempotencia(
                    chaveSalva
                );
            }

            const itensSalvos =
                sessionStorage.getItem(
                    STORAGE_ITENS
                );

            if (!itensSalvos) {
                return;
            }

            const dados =
                JSON.parse(
                    itensSalvos
                ) as ItemPedidoSalvo[];

            if (
                !Array.isArray(dados) ||
                dados.length === 0
            ) {
                return;
            }

            const itensRestaurados:
                ItemPedidoLocal[] = [];

            for (
                const itemSalvo of dados
            ) {
                if (cancelado) {
                    return;
                }

                try {
                    const produto =
                        await obterProdutoPorId(
                            itemSalvo.produtoId
                        );

                    if (
                        produto.status !==
                        StatusProduto.Ativo
                    ) {
                        continue;
                    }

                    if (
                        produto.quantidadeEstoque <= 0
                    ) {
                        continue;
                    }

                    const quantidade =
                        Math.min(
                            itemSalvo.quantidade,
                            produto.quantidadeEstoque
                        );

                    if (
                        quantidade <= 0
                    ) {
                        continue;
                    }

                    itensRestaurados.push({
                        produto,
                        quantidade
                    });
                } catch {
                    /*
                     * O produto pode não existir mais
                     * ou estar indisponível.
                     */
                }
            }

            if (!cancelado) {
                setItens(
                    itensRestaurados
                );
            }
        } catch {
            sessionStorage.removeItem(
                STORAGE_ITENS
            );

            sessionStorage.removeItem(
                STORAGE_IDEMPOTENCIA
            );
        } finally {
            if (!cancelado) {
                setRestaurando(false);
            }
        }
    }

    void executarRestauracao();

    return () => {
        cancelado = true;
    };
}, []);

    useEffect(() => {
        let cancelado = false;

        listarProdutos({
            pagina: 1,
            tamanhoPagina: 50,
            nome:
                buscaAplicada ||
                undefined,
            status:
                StatusProduto.Ativo,
            ordenarPor: "nome",
            direcao: "asc"
        })
            .then((resultado) => {
                if (cancelado) {
                    return;
                }

                setProdutos(
                    resultado.itens
                );

                setErro("");
            })
            .catch((error) => {
                if (cancelado) {
                    return;
                }

                if (error instanceof ApiError) {
                    setErro(
                        error.message
                    );
                } else {
                    setErro(
                        "Não foi possível carregar os produtos."
                    );
                }
            })
            .finally(() => {
                if (!cancelado) {
                    setCarregandoProdutos(
                        false
                    );
                }
            });

        return () => {
            cancelado = true;
        };
    }, [
        buscaAplicada
    ]);

    useEffect(() => {
        if (restaurando) {
            return;
        }

        const itensSalvar:
            ItemPedidoSalvo[] =
            itens.map((item) => ({
                produtoId:
                    item.produto.id,

                quantidade:
                    item.quantidade
            }));

        sessionStorage.setItem(
            STORAGE_ITENS,
            JSON.stringify(
                itensSalvar
            )
        );
    }, [
        itens,
        restaurando
    ]);


    function pesquisar(
        event: FormEvent
    ) {
        event.preventDefault();

        const novaBusca =
            busca.trim();

        if (
            novaBusca === buscaAplicada
        ) {
            return;
        }

        setCarregandoProdutos(
            true
        );

        setBuscaAplicada(
            novaBusca
        );
    }

    function invalidarIdempotencia() {
        setChaveIdempotencia(
            null
        );

        sessionStorage.removeItem(
            STORAGE_IDEMPOTENCIA
        );
    }

    function adicionarProduto(
        produto: Produto
    ) {
        setErro("");

        if (
            produto.quantidadeEstoque <= 0
        ) {
            setErro(
                `O produto ${produto.nome} não possui estoque disponível.`
            );

            return;
        }

        const itemExistente =
            itens.find(
                (item) =>
                    item.produto.id ===
                    produto.id
            );

        if (itemExistente) {
            if (
                itemExistente.quantidade >=
                produto.quantidadeEstoque
            ) {
                setErro(
                    `A quantidade de ${produto.nome} não pode ultrapassar o estoque disponível.`
                );

                return;
            }

            invalidarIdempotencia();

            setItens(
                itens.map((item) =>
                    item.produto.id ===
                        produto.id
                        ? {
                            ...item,
                            quantidade:
                                item.quantidade + 1
                        }
                        : item
                )
            );

            return;
        }

        invalidarIdempotencia();

        setItens([
            ...itens,
            {
                produto,
                quantidade: 1
            }
        ]);
    }

    function alterarQuantidade(
        produtoId: number,
        quantidade: number
    ) {
        const item =
            itens.find(
                (itemAtual) =>
                    itemAtual.produto.id ===
                    produtoId
            );

        if (!item) {
            return;
        }

        if (quantidade <= 0) {
            removerItem(
                produtoId
            );

            return;
        }

        if (
            quantidade >
            item.produto.quantidadeEstoque
        ) {
            setErro(
                `A quantidade de ${item.produto.nome} não pode ultrapassar o estoque disponível.`
            );

            return;
        }

        setErro("");

        invalidarIdempotencia();

        setItens(
            itens.map((itemAtual) =>
                itemAtual.produto.id ===
                    produtoId
                    ? {
                        ...itemAtual,
                        quantidade
                    }
                    : itemAtual
            )
        );
    }

    function removerItem(
        produtoId: number
    ) {
        invalidarIdempotencia();

        setItens(
            itens.filter(
                (item) =>
                    item.produto.id !==
                    produtoId
            )
        );
    }

    async function finalizarPedido() {
        if (
            itens.length === 0
        ) {
            setErro(
                "Adicione pelo menos um produto ao pedido."
            );

            return;
        }

        try {
            setCriandoPedido(true);
            setErro("");

            let chave =
                chaveIdempotencia;

            if (!chave) {
                chave =
                    crypto.randomUUID();

                setChaveIdempotencia(
                    chave
                );

                sessionStorage.setItem(
                    STORAGE_IDEMPOTENCIA,
                    chave
                );
            }

            const pedido =
                await criarPedido(
                    {
                        itens:
                            itens.map((item) => ({
                                produtoId:
                                    item.produto.id,

                                quantidade:
                                    item.quantidade
                            }))
                    },
                    chave
                );

            sessionStorage.removeItem(
                STORAGE_ITENS
            );

            sessionStorage.removeItem(
                STORAGE_IDEMPOTENCIA
            );

            await router.push(
                `/pedidos/${pedido.id}`
            );
        } catch (error) {
            if (error instanceof ApiError) {
                setErro(
                    error.message
                );
            } else {
                setErro(
                    "Não foi possível criar o pedido. Você pode tentar novamente sem alterar os itens."
                );
            }
        } finally {
            setCriandoPedido(false);
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

    const quantidadeTotal =
        itens.reduce(
            (
                total,
                item
            ) =>
                total +
                item.quantidade,
            0
        );

    const subtotal =
        itens.reduce(
            (
                total,
                item
            ) =>
                total +
                item.produto.preco *
                item.quantidade,
            0
        );

    const percentualDesconto =
        quantidadeTotal > 10
            ? 0.1
            : quantidadeTotal > 5
                ? 0.05
                : 0;

    const desconto =
        subtotal *
        percentualDesconto;

    const total =
        subtotal -
        desconto;

    if (restaurando) {
        return (
            <div className="page-loading">
                <div className="spinner" />

                <span>
                    Recuperando pedido...
                </span>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title="Novo pedido"
                description="Selecione os produtos e revise os valores antes de confirmar."
                actions={
                    <Link
                        href="/pedidos"
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

            <div className="new-order-layout">
                <div className="new-order-main">
                    <section className="form-section-card">
                        <div className="form-section-header">
                            <div>
                                <h2>
                                    Adicionar produtos
                                </h2>

                                <p>
                                    Pesquise produtos ativos e
                                    disponíveis em estoque.
                                </p>
                            </div>
                        </div>

                        <div className="product-selector">
                            <form
                                className="order-product-search"
                                onSubmit={pesquisar}
                            >
                                <div className="input-with-icon">
                                    <Search
                                        size={17}
                                        className="input-icon"
                                    />

                                    <input
                                        type="text"
                                        value={busca}
                                        onChange={(event) =>
                                            setBusca(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Buscar produto por nome..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="button-primary"
                                    disabled={
                                        carregandoProdutos
                                    }
                                >
                                    <Search size={16} />

                                    Buscar
                                </button>
                            </form>

                            {carregandoProdutos ? (
                                <div className="product-selector-loading">
                                    <div className="spinner" />

                                    <span>
                                        Buscando produtos...
                                    </span>
                                </div>
                            ) : produtos.length === 0 ? (
                                <div className="product-selector-empty">
                                    <PackageOpen
                                        size={24}
                                    />

                                    <strong>
                                        Nenhum produto encontrado
                                    </strong>

                                    <span>
                                        Tente pesquisar por outro nome.
                                    </span>
                                </div>
                            ) : (
                                <div className="product-selection-list">
                                    {produtos.map(
                                        (produto) => {
                                            const item =
                                                itens.find(
                                                    (
                                                        itemAtual
                                                    ) =>
                                                        itemAtual
                                                            .produto
                                                            .id ===
                                                        produto.id
                                                );

                                            const indisponivel =
                                                produto.quantidadeEstoque <=
                                                0;

                                            return (
                                                <div
                                                    key={
                                                        produto.id
                                                    }
                                                    className="product-selection-item"
                                                >
                                                    <div className="product-selection-info">
                                                        <div className="product-avatar product-avatar-large">
                                                            {produto.nome
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>

                                                        <div className="product-selection-text">
                                                            <strong>
                                                                {produto.nome}
                                                            </strong>

                                                            {produto.descricao && (
                                                                <span>
                                                                    {
                                                                        produto.descricao
                                                                    }
                                                                </span>
                                                            )}

                                                            <div className="product-selection-meta">
                                                                <span className="product-selection-price">
                                                                    {formatarMoeda(
                                                                        produto.preco
                                                                    )}
                                                                </span>

                                                                <span>
                                                                    {
                                                                        produto.quantidadeEstoque
                                                                    }
                                                                    {" "}
                                                                    em estoque
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className={
                                                            item
                                                                ? "button-secondary product-add-button selected"
                                                                : "button-secondary product-add-button"
                                                        }
                                                        disabled={
                                                            indisponivel
                                                        }
                                                        onClick={() =>
                                                            adicionarProduto(
                                                                produto
                                                            )
                                                        }
                                                    >
                                                        <Plus
                                                            size={15}
                                                        />

                                                        {item
                                                            ? `Adicionar (${item.quantidade})`
                                                            : "Adicionar"}
                                                    </button>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="form-section-card">
                        <div className="form-section-header">
                            <div className="form-section-icon">
                                <ShoppingCart
                                    size={19}
                                />
                            </div>

                            <div>
                                <h2>
                                    Itens do pedido
                                </h2>

                                <p>
                                    Ajuste as quantidades antes
                                    de confirmar.
                                </p>
                            </div>
                        </div>

                        {itens.length === 0 ? (
                            <div className="order-cart-empty">
                                <ShoppingCart
                                    size={27}
                                />

                                <strong>
                                    Seu pedido está vazio
                                </strong>

                                <span>
                                    Adicione produtos utilizando
                                    a lista acima.
                                </span>
                            </div>
                        ) : (
                            <div className="order-cart-list">
                                {itens.map(
                                    (item) => (
                                        <div
                                            key={
                                                item.produto.id
                                            }
                                            className="order-cart-item"
                                        >
                                            <div className="order-cart-product">
                                                <div className="product-avatar">
                                                    {item.produto.nome
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>

                                                <div>
                                                    <strong>
                                                        {
                                                            item.produto.nome
                                                        }
                                                    </strong>

                                                    <span>
                                                        {formatarMoeda(
                                                            item.produto.preco
                                                        )}
                                                        {" por unidade"}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="quantity-control">
                                                <button
                                                    type="button"
                                                    aria-label="Diminuir quantidade"
                                                    disabled={
                                                        criandoPedido
                                                    }
                                                    onClick={() =>
                                                        alterarQuantidade(
                                                            item.produto.id,
                                                            item.quantidade -
                                                            1
                                                        )
                                                    }
                                                >
                                                    <Minus
                                                        size={14}
                                                    />
                                                </button>

                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={
                                                        item.produto
                                                            .quantidadeEstoque
                                                    }
                                                    value={
                                                        item.quantidade
                                                    }
                                                    disabled={
                                                        criandoPedido
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        alterarQuantidade(
                                                            item.produto.id,
                                                            Number(
                                                                event.target
                                                                    .value
                                                            )
                                                        )
                                                    }
                                                />

                                                <button
                                                    type="button"
                                                    aria-label="Aumentar quantidade"
                                                    disabled={
                                                        criandoPedido ||
                                                        item.quantidade >=
                                                        item.produto
                                                            .quantidadeEstoque
                                                    }
                                                    onClick={() =>
                                                        alterarQuantidade(
                                                            item.produto.id,
                                                            item.quantidade +
                                                            1
                                                        )
                                                    }
                                                >
                                                    <Plus
                                                        size={14}
                                                    />
                                                </button>
                                            </div>

                                            <div className="order-cart-stock">
                                                <span>
                                                    Estoque
                                                </span>

                                                <strong>
                                                    {
                                                        item.produto
                                                            .quantidadeEstoque
                                                    }
                                                </strong>
                                            </div>

                                            <div className="order-cart-total">
                                                <span>
                                                    Total
                                                </span>

                                                <strong>
                                                    {formatarMoeda(
                                                        item.produto.preco *
                                                        item.quantidade
                                                    )}
                                                </strong>
                                            </div>

                                            <button
                                                type="button"
                                                className="order-cart-remove"
                                                disabled={
                                                    criandoPedido
                                                }
                                                aria-label={`Remover ${item.produto.nome}`}
                                                onClick={() =>
                                                    removerItem(
                                                        item.produto.id
                                                    )
                                                }
                                            >
                                                <Trash2
                                                    size={16}
                                                />
                                            </button>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </section>
                </div>

                <aside className="new-order-sidebar">
                    <div className="checkout-card">
                        <div className="checkout-header">
                            <h2>
                                Resumo do pedido
                            </h2>

                            <p>
                                Revise os valores antes
                                de confirmar.
                            </p>
                        </div>

                        <div className="checkout-body">
                            <div className="checkout-items-count">
                                <ShoppingCart
                                    size={17}
                                />

                                <div>
                                    <strong>
                                        {quantidadeTotal}
                                        {" "}
                                        {quantidadeTotal === 1
                                            ? "unidade"
                                            : "unidades"}
                                    </strong>

                                    <span>
                                        {itens.length}
                                        {" "}
                                        {itens.length === 1
                                            ? "produto"
                                            : "produtos"}
                                    </span>
                                </div>
                            </div>

                            <div className="checkout-divider" />

                            <div className="checkout-row">
                                <span>
                                    Subtotal
                                </span>

                                <strong>
                                    {formatarMoeda(
                                        subtotal
                                    )}
                                </strong>
                            </div>

                            <div className="checkout-row">
                                <span>
                                    Desconto
                                </span>

                                {desconto > 0 ? (
                                    <strong className="checkout-discount">
                                        -
                                        {formatarMoeda(
                                            desconto
                                        )}
                                    </strong>
                                ) : (
                                    <strong>
                                        {formatarMoeda(
                                            0
                                        )}
                                    </strong>
                                )}
                            </div>

                            {percentualDesconto >
                                0 && (
                                    <div className="discount-applied">
                                        Desconto de{" "}
                                        <strong>
                                            {percentualDesconto *
                                                100}
                                            %
                                        </strong>{" "}
                                        aplicado pela quantidade
                                        de itens.
                                    </div>
                                )}

                            <div className="checkout-divider" />

                            <div className="checkout-total">
                                <span>
                                    Total estimado
                                </span>

                                <strong>
                                    {formatarMoeda(
                                        total
                                    )}
                                </strong>
                            </div>

                            <div className="checkout-warning">
                                Os valores exibidos são uma
                                estimativa. Preços, estoque,
                                desconto e total serão
                                validados e calculados
                                novamente pelo backend no
                                momento da criação.
                            </div>

                            <button
                                type="button"
                                className="button-primary checkout-submit"
                                disabled={
                                    criandoPedido ||
                                    itens.length === 0
                                }
                                onClick={
                                    finalizarPedido
                                }
                            >
                                <ShoppingCart
                                    size={17}
                                />

                                {criandoPedido
                                    ? "Criando pedido..."
                                    : "Criar pedido"}
                            </button>

                            <Link
                                href="/pedidos"
                                className="button-secondary checkout-cancel"
                            >
                                Cancelar
                            </Link>
                        </div>
                    </div>
                </aside>
            </div>
        </>
    );
}