import Link from "next/link";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({
  children
}: LayoutProps) {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Order Management</h1>

        <nav className="app-nav">
          <Link href="/">
            Início
          </Link>

          <Link href="/produtos">
            Produtos
          </Link>

          <Link href="/pedidos">
            Pedidos
          </Link>
        </nav>
      </header>

      <main className="app-content">
        {children}
      </main>
    </div>
  );
}