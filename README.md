# Tes Desktop

Tauri 2 + React + TypeScript + TanStack Router + Tailwind CSS 4.

## Development

```sh
pnpm install
pnpm tauri dev
```

Browser-only preview: `pnpm dev`. Rust commands require the desktop app.

Frontend validation: `pnpm build` (generates routes, bundles frontend, checks types).
Rust validation: `cargo check --manifest-path src-tauri/Cargo.toml`.

Routes live in `src/routes`. Do not manually edit `src/routeTree.gen.ts`.
Hash history supports navigation within the packaged desktop app.

## ONNX Runtime (Rust)

The backend includes `ort = "=2.0.0-rc.14"`, the Rust binding for ONNX Runtime.
Default features download the native runtime during compilation and copy required
dynamic libraries to the build output. The initial build requires internet access.
CPU execution is available by default; GPU providers are not enabled.
No model is bundled yet. Load an ONNX model with
`ort::session::Session::builder()?.commit_from_file(model_path)?` when adding inference.

## Pas foto MVP

Open the editor from the welcome screen. Import JPG, PNG, or WebP (up to 20 MB / 40 MP), choose 2x3, 3x4, or 4x6 cm, adjust crop/zoom/rotation and brightness/contrast, then export JPG. Files are processed locally.

Output pixels: 236x354, 354x472, or 472x709, intended for printing at 300 ppi. Set the physical print size explicitly; JPEG resolution metadata is not set to 300 dpi.

Browser export downloads the JPG. Tauri export uses a native save dialog. Automatic background removal and editable project persistence are not included in this MVP. Edits are held in memory until the page closes.
