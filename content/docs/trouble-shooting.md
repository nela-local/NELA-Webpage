# Fix problems

Short fixes for common hiccups.

## File Indexer / Search my files feels empty

- Confirm the folder finished indexing (first pass can take a bit on large trees).
- Make sure **Search my files** is enabled for that chat turn.
- Point the indexer at the folder that actually holds the content.
- After big file moves, reopen NELA or wait for a resync.

## Document library answers are weak

- Check that files show as ready in the library.
- Ask a more specific question and name the document if you can.
- If you changed retrieval models, rebuild the library index.

## Model download fails

- Check network and free disk space.
- Try a smaller model first.
- Confirm the model shows as installed before selecting it.

## Cloud will not answer

- Sign in and open Cloud settings.
- Check plan / credits / Fast free window.
- Confirm the top bar is on Cloud (or Auto with entitlement).

## Running from source

```bash
echo $GENHAT_MODEL_PATH
```

Verify the path if models live outside the default folder.

Still stuck? Revisit [Get started](/docs/installation) or [Private vs Cloud](/docs/features/private-vs-cloud).
