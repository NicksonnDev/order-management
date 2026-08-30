import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

const itensMenu = [
  {
    href: "/",
    nome: "Dashboard",
    icon: LayoutDashboard
  },
  {
    href: "/produtos",
    nome: "Produtos",
    icon: Package
  },
  {
    href: "/pedidos",
    nome: "Pedidos",
    icon: ShoppingCart
  }
];

export default function Layout({
  children
}: LayoutProps) {
  const router = useRouter();

  function itemAtivo(
    href: string
  ) {
    if (href === "/") {
      return router.pathname === "/";
    }

    return router.pathname.startsWith(
      href
    );
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            OM
          </div>

          <div>
            <strong>
              Order Management
            </strong>

            <span>
              Painel administrativo
            </span>
          </div>
        </div>

        <nav
          className="sidebar-nav"
          aria-label="Navegação principal"
        >
          {itensMenu.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  itemAtivo(item.href)
                    ? "sidebar-link active"
                    : "sidebar-link"
                }
              >
                <Icon
                  size={19}
                  strokeWidth={1.8}
                />

                <span>
                  {item.nome}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <span className="environment-badge">
            Em Desenvolvimento
          </span>

        
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div>
            <span className="app-topbar-label">
              Sistema de gerenciamento
            </span>
          </div>

          <div className="app-topbar-status">
            <span className="status-dot" />

            API conectada
          </div>
        </header>

        <main className="app-content">
          {children}
        </main>
      </div>
    </div>
  );
}