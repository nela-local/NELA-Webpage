# How it fits together

A light picture of NELA — enough to orient yourself, not a systems manual.

```mermaid
flowchart LR
  you[You] --> app[NELA desktop]
  app --> private[Private models]
  app --> cloud[NELA Cloud]
  app --> library[Document library]
  app --> indexer[File Indexer]
  library --> app
  indexer --> app
  private --> answers[Answers and files]
  cloud --> answers
```

- **Private** — models on this device.
- **Cloud** — optional hosted Fast / Smart / Deep.
- **Document library** — curated uploads for grounded Q&A.
- **File Indexer** — smart search over folders (flagship retrieval).
- **Artifacts** — decks, sheets, HTML, Word from Chat.

For day-to-day use, start with [Welcome](/docs/what-is-it) and the [File Indexer](/docs/features/file-indexer). Deeper Private generation notes live under [Private inference](/docs/features/private-inference).
