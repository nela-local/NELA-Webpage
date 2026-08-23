# Get started

## Install from the website (recommended)

1. Open the [Download page](/download).
2. Pick your OS and version, then run the installer.
3. Launch NELA and create or continue a **workspace**.
4. (Optional) Sign in from Profile if you want **NELA Cloud**.

## First session checklist

1. Create a workspace from the startup screen.
2. Stay on **Private**, or switch to **Cloud** after signing in.
3. Install at least one chat model in Settings (Private), or use Cloud tiers.
4. Try a simple Chat question.
5. Turn on [File Indexer](/docs/features/file-indexer) (**Search my files**) for a project folder — or add a few PDFs to the [Document library](/docs/features/local-indexing).
6. Ask for a short [presentation or spreadsheet](/docs/features/artifacts) if you want to see file creation.

## Run from source (developers)

```bash
cd genhat-desktop
npm ci
npx tauri dev
```

Needs Node.js 24+, Rust, and the usual Tauri system libraries on Linux. Custom model path (dev): `GENHAT_MODEL_PATH`.

## Stuck?

See [Fix problems](/docs/trouble-shooting).
