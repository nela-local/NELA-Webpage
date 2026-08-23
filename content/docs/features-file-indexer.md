# File Indexer

NELA’s **File Indexer** turns folders on your computer into a searchable knowledge graph the assistant can use while you chat. It is built for real project trees — not just a bag of loose paragraphs — and is one of the strongest parts of the product.

In the app this shows up as **Search my files**.

## What makes it different

Most “chat with your docs” tools only chop files into chunks and hope a similarity search finds the right piece. NELA’s File Indexer goes further:

- **Understands structure** — how files relate (folders, links, and document structure), not only raw text blobs.
- **Hybrid search** — matches both **exact keywords** and **meaning**, then pulls in related material so answers stay grounded.
- **Built for folders** — point it at a project directory; it keeps up as files change and can catch up again when you reopen NELA.
- **Stays on your machine** — indexing and search run locally in Private workflows. Cloud only sees files you explicitly attach to a Cloud chat.

You do not need to know the internals. Think of it as a librarian that reads your tree, remembers relationships, and hands the assistant the right pages when you ask.

## How to use it

1. Index or sync the folders you care about (from the files / knowledge tools in the app).
2. In Chat, turn on **Search my files**.
3. Ask questions in natural language (“Where do we define the pricing rules?” / “Summarize the onboarding docs”).
4. Prefer concrete questions — the indexer is best when there is something real to find.

## File Indexer vs Document library

| | **File Indexer** | **Document library** |
|---|---|---|
| Best for | Whole folders / projects on disk | Selected PDFs, Word, slides you add |
| How you ask | **Search my files** | **Search my documents** |
| Feel | Deep folder search with structure | Classic “ask my uploaded docs” with sources |

Many people use both: library for curated packs, File Indexer for the live project tree.

## Tips for great results

- Index the folder that actually contains the source of truth (not a huge dump of unrelated downloads).
- After big renames or moves, give NELA a moment to resync.
- If answers feel off, check that **Search my files** is on for that turn.
- Private mode keeps this path on-device; see [Private vs Cloud](/docs/features/private-vs-cloud) if you mix in Cloud chats.

Next: [Document library](/docs/features/local-indexing) · [Create files](/docs/features/artifacts)
