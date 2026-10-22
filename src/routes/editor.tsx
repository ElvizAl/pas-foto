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
    return <label className="block text-xs text-stone-600"><span className="mb-2 flex justify-between"><span>{label}</span><span className="tabular-nums">{key === "zoom" ? `${edit[key].toFixed(2)}×` : `${edit[key]}%`}</span></span><input className="w-full accent-teal-700" type="range" min={min} max={max} step={step} value={edit[key]} disabled={!photo || busy} onChange={(event) => setEdit((current) => ({ ...current, [key]: Number(event.target.value) }))} /></label>;
  }

  return <div className="min-h-screen bg-[#f4f5f2]">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-white px-6 py-4">
      <div className="flex items-center gap-4"><Link to="/" aria-label="Kembali ke awal" onClick={(event) => { if (photo && !window.confirm("Kembali ke awal? Foto dan pengaturan yang belum diekspor akan hilang.")) event.preventDefault(); }} className="text-stone-500">←</Link><div><h1 className="font-semibold">Editor pas foto</h1><p className="text-xs text-stone-400">Crop, sesuaikan, dan simpan.</p></div></div>
      <button className="rounded-lg bg-teal-800 px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40" disabled={!photo || busy || loading} onClick={() => void exportPhoto()}>{busy ? "Menyimpan…" : "Ekspor JPG"}</button>
    </header>
    <div className="editor-layout">
      <main className="flex min-w-0 flex-col items-center justify-center gap-5 p-6 sm:p-10">
        <div className="text-center"><p className="max-w-xs truncate text-sm text-stone-600">{name || "Foto Anda tampil di sini"}</p><p className="mt-1 text-xs text-stone-400">{size} cm · {width} × {height} px</p></div>
        <div className="photo-stage" style={{ aspectRatio: `${width}/${height}` }}>
          <canvas ref={canvas} width={width} height={height} className="block h-full w-full" aria-label={`Pratinjau pas foto ${size} cm`} />
          {!photo && <button onClick={() => input.current?.click()} className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-5 text-center"><span className="grid h-12 w-12 place-items-center rounded-full bg-teal-50 text-2xl text-teal-700">+</span><span className="text-sm font-medium">Buka foto pertama</span><span className="text-xs text-stone-400">JPG, PNG, atau WebP</span></button>}
        </div>
        <p className="max-w-sm text-center text-xs leading-5 text-stone-400">Posisikan wajah di tengah dan sisakan ruang di atas kepala.</p>
      </main>
      <aside className="border-l border-stone-200 bg-white p-6">
        <h2 className="mb-5 text-sm font-semibold">Pengaturan foto</h2>
        <button disabled={loading || busy} onClick={() => input.current?.click()} className="mb-6 w-full rounded-lg border border-stone-200 px-4 py-3 text-sm hover:bg-stone-50 disabled:opacity-40">{loading ? "Membaca foto…" : photo ? "Ganti foto" : "Buka foto"}</button>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Pilih foto" className="hidden" onChange={(event) => { void openPhoto(event.target.files?.[0]); event.target.value = ""; }} />
        <fieldset disabled={busy} className="mb-6"><legend className="mb-3 text-xs text-stone-500">Ukuran pas foto</legend><div className="flex gap-2">{(Object.keys(sizes) as Size[]).map((value) => <button key={value} aria-pressed={value === size} onClick={() => setSize(value)} className={`flex-1 rounded-lg border py-2 text-sm ${value === size ? "border-teal-700 bg-teal-50 text-teal-800" : "border-stone-200 text-stone-500"}`}>{value}</button>)}</div></fieldset>
        <div className="space-y-5">{slider("zoom", "Zoom", 1, 3, 0.01)}{slider("x", "Posisi horizontal", -100, 100)}{slider("y", "Posisi vertikal", -100, 100)}</div>
        <button disabled={!photo || busy} className="mt-5 w-full rounded-lg border border-stone-200 py-2 text-xs disabled:opacity-40" onClick={() => setEdit((current) => ({ ...current, rotation: (current.rotation + 90) % 360, x: 0, y: 0 }))}>↻ Putar 90°</button>
        <details className="mt-6 border-t border-stone-100 pt-5"><summary className="cursor-pointer text-sm text-stone-600">Cahaya & kontras</summary><div className="mt-5 space-y-5">{slider("brightness", "Kecerahan", 50, 150)}{slider("contrast", "Kontras", 50, 150)}</div></details>
        <button disabled={!photo || busy} onClick={() => setEdit(initial)} className="mt-6 text-xs text-stone-500 underline underline-offset-4 disabled:opacity-40">Reset pengaturan</button>
        <p role="status" className="mt-5 break-words text-xs leading-5 text-teal-800">{status}</p>
        <p className="mt-6 text-[11px] leading-5 text-stone-400">Resolusi disiapkan untuk 300 ppi. Pilih ukuran {size} cm saat mencetak. Latar asli foto tetap digunakan.</p>
      </aside>
    </div>
  </div>;
}
