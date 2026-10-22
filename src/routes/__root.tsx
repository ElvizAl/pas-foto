import { createRootRoute, Link, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: () => (
    <main className="grid min-h-screen place-content-center gap-4 text-center">
      <h1 className="text-xl font-semibold">Halaman tidak ditemukan</h1>
      <Link to="/" className="text-teal-700 underline">Kembali ke awal</Link>
    </main>
  ),
});
