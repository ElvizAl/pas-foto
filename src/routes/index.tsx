import { createFileRoute, Link } from "@tanstack/react-router";


export const Route = createFileRoute("/")({ component: Welcome });

function Welcome() {



  return (
    <div className="welcome-shell">
      <header className="flex items-center justify-between gap-4 px-7 py-6 sm:px-10">
        <Link to="/" className="flex items-center gap-3 font-semibold tracking-tight" aria-label="Tes Desktop, halaman awal">
          <span className="app-mark" aria-hidden="true"><span /><span /></span>
          Tes Desktop
        </Link>
        <span className="text-xs text-stone-400">EDITOR WORKSPACE</span>
      </header>

      <main className="welcome-main">
        <section className="welcome-copy">
          <div className="mb-6 flex items-center gap-2 text-xs font-medium tracking-widest text-teal-700">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-600" /> SELAMAT DATANG
          </div>
          <h1 className="max-w-md text-4xl font-semibold leading-[1.16] tracking-[-0.045em] sm:text-5xl">Pas foto rapi.<br />Tanpa ribet.</h1>
          <p className="mt-5 max-w-xs text-sm leading-7 text-stone-500">Pilih foto, sesuaikan ukuran dan posisi, lalu simpan hasilnya untuk dicetak.</p>

          <div className="mt-9 flex max-w-xs flex-col gap-3">
            <Link to="/editor" className="open-project-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 8V6a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v2" /><path d="M3 9h5l2 2h10a1 1 0 0 1 .97 1.24l-1.5 6A2 2 0 0 1 17.53 20H5a2 2 0 0 1-2-2V9Z" /></svg>
              <span className="flex-1 text-left">Mulai pas foto</span>
              <span aria-hidden="true" className="text-teal-200">↗</span>
            </Link>
            <Link to="/about" className="about-button">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7v1" /></svg>
              Tentang aplikasi
            </Link>
          </div>

        </section>

        <div className="workspace-art" aria-hidden="true">
          <div className="art-orbit" />
          <div className="art-sheet art-sheet-back" />
          <div className="art-sheet art-sheet-front">
            <div className="art-toolbar"><span /><span /><span /><i /></div>
            <div className="art-layout">
              <div className="art-picture"><div className="art-sun" /><div className="art-hill art-hill-back" /><div className="art-hill" /></div>
              <div className="art-side"><div /><span /><span /><span /></div>
            </div>
            <div className="art-bottom"><span /><span /><span /></div>
          </div>
          <span className="art-spark art-spark-one">+</span><span className="art-spark art-spark-two">+</span>
          <div className="art-caption">IDE BESAR DIMULAI DARI SINI</div>
        </div>
      </main>
      <footer className="flex flex-wrap items-center justify-between gap-3 px-7 py-6 text-xs text-stone-400 sm:px-10">
        <span>Ruang kerja Anda, satu proyek dalam satu waktu.</span>
        <span>Versi 0.1.0</span>
      </footer>
    </div>
  );
}

