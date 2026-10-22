import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({ component: About });

function About() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-7 py-12">
      <Link to="/" className="mb-12 w-fit text-sm text-stone-500 transition hover:text-teal-700">← Kembali ke awal</Link>
      <span className="app-mark mb-6" aria-hidden="true"><span /><span /></span>
      <p className="mb-3 text-xs font-medium tracking-widest text-teal-700">TENTANG APLIKASI</p>
      <h1 className="text-4xl font-semibold tracking-tight">Tes Desktop</h1>
      <p className="mt-5 text-base leading-8 text-stone-500">Editor pas foto sederhana untuk crop, mengatur cahaya, dan mengekspor foto ukuran 2×3, 3×4, atau 4×6 cm.</p>
      <div className="mt-8 rounded-2xl border border-stone-200 bg-white/70 p-5 text-sm leading-7 text-stone-500">
        <p className="font-medium text-stone-800">Tahap pengembangan awal</p>
        <p>Buka foto JPG, PNG, atau WebP dan ekspor hasil sebagai JPG. Penggantian latar otomatis dan penyimpanan proyek belum tersedia.</p>
      </div>
      <p className="mt-8 text-xs text-stone-400">Versi 0.1.0</p>
    </main>
  );
}

