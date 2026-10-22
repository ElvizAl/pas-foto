import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";

export const Route = createFileRoute("/editor")({ component: PhotoEditor });
const sizes = { "2×3": [236, 354], "3×4": [354, 472], "4×6": [472, 709] } as const;
type Size = keyof typeof sizes;
const initial = { zoom: 1, x: 0, y: 0, brightness: 100, contrast: 100, rotation: 0 };

function PhotoEditor() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const request = useRef(0);
  const [photo, setPhoto] = useState<HTMLImageElement | null>(null);
  const [name, setName] = useState("");
  const [size, setSize] = useState<Size>("3×4");
  const [edit, setEdit] = useState(initial);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guide, setGuide] = useState(false);
  const [width, height] = sizes[size];

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);
    if (!photo) return;
    const swapped = edit.rotation % 180 !== 0;
    const iw = swapped ? photo.naturalHeight : photo.naturalWidth;
    const ih = swapped ? photo.naturalWidth : photo.naturalHeight;
    const scale = Math.max(width / iw, height / ih) * edit.zoom;
    const dx = (iw * scale - width) / 2 * edit.x / 100;
    const dy = (ih * scale - height) / 2 * edit.y / 100;
    ctx.save();
    ctx.translate(width / 2 + dx, height / 2 + dy);
    ctx.rotate(edit.rotation * Math.PI / 180);
    ctx.filter = `brightness(${edit.brightness}%) contrast(${edit.contrast}%)`;
    ctx.drawImage(photo, -photo.naturalWidth * scale / 2, -photo.naturalHeight * scale / 2, photo.naturalWidth * scale, photo.naturalHeight * scale);
    ctx.restore();
  }, [photo, edit, width, height]);

  async function openPhoto(file?: File) {
    if (!file) return;
    const id = ++request.current;
    setStatus("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setStatus("Pilih foto JPG, PNG, atau WebP."); return;
    }
    if (file.size > 20 * 1024 * 1024) { setStatus("Ukuran foto maksimal 20 MB."); return; }
    setLoading(true);
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      if (id !== request.current) return;
      if (image.naturalWidth * image.naturalHeight > 40_000_000) throw new Error("Foto maksimal 40 megapiksel.");
      setPhoto(image); setName(file.name); setEdit(initial);
      setStatus("Foto siap. Atur posisi wajah di dalam bingkai.");
    } catch (error) {
      if (id === request.current) setStatus(error instanceof Error && error.message.includes("megapiksel") ? error.message : "Foto tidak dapat dibaca. Coba file lain.");
    } finally { URL.revokeObjectURL(url); if (id === request.current) setLoading(false); }
  }

  async function exportPhoto() {
    if (!canvas.current || !photo) return;
    setBusy(true); setStatus("");
    try {
      const blob = await new Promise<Blob>((resolve, reject) => canvas.current!.toBlob((value) => value ? resolve(value) : reject(new Error("Gagal membuat JPG.")), "image/jpeg", 0.95));
      const filename = `pas-foto-${size.replace("×", "x")}.jpg`;
      if (isTauri()) {
        const saved = await invoke<boolean>("save_photo", { bytes: Array.from(new Uint8Array(await blob.arrayBuffer())), filename });
        setStatus(saved ? "Pas foto berhasil disimpan." : "Penyimpanan dibatalkan.");
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a"); link.href = url; link.download = filename; link.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        setStatus("JPG siap diunduh. Saat mencetak, atur ukuran sesuai pilihan cm.");
      }
    } catch (error) { setStatus(`Gagal menyimpan: ${String(error)}`); }
    finally { setBusy(false); }
  }

  function slider(key: "zoom" | "x" | "y" | "brightness" | "contrast", label: string, min: number, max: number, step = 1) {
    return <label className="edit-slider"><span><span>{label}</span><output>{key === "zoom" ? `${Math.round(edit[key] * 100)}%` : `${edit[key]}%`}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={edit[key]} disabled={!photo || busy || loading} onChange={(event) => setEdit((current) => ({ ...current, [key]: Number(event.target.value) }))} /></label>;
  }

  return <div className="photo-editor">
    <header className="editor-header">
      <div className="editor-brand"><Link to="/" aria-label="Kembali ke awal" className="editor-back" onClick={(event) => { if (photo && !window.confirm("Kembali ke awal? Foto dan pengaturan yang belum diekspor akan hilang.")) event.preventDefault(); }}>←</Link><div><h1>Studio pas foto<span>MVP</span></h1><p>Foto siap cetak, dalam beberapa langkah.</p></div></div>
      <button className="editor-save" disabled={!photo || busy || loading} onClick={() => void exportPhoto()}><span aria-hidden="true">↓</span>{busy ? "Menyimpan…" : "Simpan foto"}</button>
    </header>
    <div className="editor-progress" aria-label="Langkah editing"><span className={photo ? "complete" : "current"}><b>{photo ? "✓" : "1"}</b> Buka foto</span><i /><span className={photo ? "current" : ""}><b>2</b> Sesuaikan</span><i /><span><b>3</b> Simpan JPG</span></div>
    <div className="editor-layout">
      <main className="editor-workspace">
        <div className="workspace-heading"><div><span className="workspace-eyebrow">PRATINJAU</span><h2>{photo ? "Pas foto Anda" : "Mulai dengan foto terbaik Anda"}</h2></div><span className="size-badge">{size} cm</span></div>
        <div className={`editor-canvas-area ${photo ? "has-photo" : ""}`}>
          <div className="photo-stage" style={{ aspectRatio: `${width}/${height}` }}>
            <canvas ref={canvas} width={width} height={height} className="block h-full w-full" aria-label={`Pratinjau pas foto ${size} cm`} />
            {!photo && <button disabled={busy || loading} onClick={() => input.current?.click()} className="photo-empty"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="9" cy="9" r="2"/><path d="m3 17 5-5 4 4 4-5 5 6"/></svg><strong>{loading ? "Membaca foto…" : "Pilih foto Anda"}</strong><span>Gunakan foto dengan wajah<br />menghadap ke depan.</span><em>＋ Buka foto</em><small>JPG, PNG, WebP · Maks. 20 MB</small></button>}
            {photo && guide && <div className="photo-guide" aria-hidden="true"><span/><span/></div>}
          </div>
          {photo && <div className="canvas-tools"><button disabled={busy || loading} onClick={() => setEdit((current) => ({ ...current, rotation: (current.rotation + 90) % 360, x: 0, y: 0 }))}>↻ Putar 90°</button><span/><button aria-pressed={guide} onClick={() => setGuide(!guide)}>{guide ? "✓ " : ""}Garis bantu</button></div>}
        </div>
        <div className="workspace-caption"><span className="caption-dot"/><p>{photo ? "Sisakan ruang di atas kepala dan posisikan wajah di tengah." : "Foto diproses di perangkat Anda."}</p></div>
        {photo && <p className="photo-filename" title={name}>{name}</p>}
      </main>
      <aside className="editor-inspector" aria-label="Pengaturan foto">
        <div className="inspector-heading"><h2>Sesuaikan foto</h2><p>Perubahan langsung terlihat di pratinjau.</p></div>
        <section className="inspector-section"><div className="section-label"><h3><span>01</span> Ukuran foto</h3><span>cm</span></div><fieldset disabled={busy || loading} aria-label="Ukuran pas foto" className="size-options">{(Object.keys(sizes) as Size[]).map((value) => <button key={value} aria-pressed={value === size} onClick={() => setSize(value)} className={value === size ? "selected" : ""}><span className="size-outline" style={{ aspectRatio: value === "3×4" ? "3/4" : "2/3" }}/><strong>{value}</strong><small>{value === size ? "Dipilih" : "Pilih ukuran"}</small></button>)}</fieldset></section>
        <section className="inspector-section"><div className="section-label"><h3><span>02</span> Posisi & ukuran wajah</h3></div><div className="slider-group">{slider("zoom", "Perbesar foto", 1, 3, 0.01)}{slider("x", "Geser kiri / kanan", -100, 100)}{slider("y", "Geser atas / bawah", -100, 100)}</div><button disabled={!photo || busy || loading} className="center-photo" onClick={() => setEdit((current) => ({ ...current, x: 0, y: 0 }))}>⊙ Kembalikan ke tengah</button></section>
        <details className="inspector-light"><summary><span><b>03</b> Cahaya & kontras</span><span className="details-chevron">⌄</span></summary><div className="slider-group">{slider("brightness", "Kecerahan", 50, 150)}{slider("contrast", "Kontras", 50, 150)}</div></details>
        <div className="inspector-actions"><button disabled={loading || busy} onClick={() => input.current?.click()}>{loading ? "Membaca…" : photo ? "Ganti foto" : "Buka foto"}</button><button disabled={!photo || busy || loading} onClick={() => setEdit(initial)}>Reset edit</button></div>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Pilih foto" className="hidden" onChange={(event) => { void openPhoto(event.target.files?.[0]); event.target.value = ""; }} />
        {status && <p role="status" className="editor-status">{status}</p>}
        <div className="export-note"><span aria-hidden="true">↙</span><div><strong>Hasil JPG · {size} cm</strong><p>{width} × {height} px. Atur ukuran {size} cm saat mencetak. Latar asli tetap digunakan.</p></div></div>
      </aside>
    </div>
  </div>;
}


