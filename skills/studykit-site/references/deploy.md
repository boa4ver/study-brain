# Sync and deploy

## Configure

```bash
cp vault-sync.config.example.json vault-sync.config.json
```

| Key | Meaning |
|---|---|
| `source` | The notes folder. `~` is expanded. |
| `target` | Where mirrored markdown lands. Must stay inside the project - the sync refuses otherwise, because it prunes this directory. |
| `include` | **The allowlist.** Top-level folder names. Nothing else is ever copied. |
| `debounceSeconds` | Quiet period after a change before syncing. 20 is sane. |
| `deploy` | `false` until the student has seen what publishes. |
| `deployCommand` | Defaults to `npx vercel --prod --yes`. |

There is no `exclude`. The list is opt-in only, so a new folder is private by
default and a typo fails closed.

## Verify before enabling deploy

Run it once locally and look at what moved:

```bash
node scripts/sync-once.mjs --no-deploy
find content/vault -type f
```

Check that list against what the student expects to be public. Only then set
`deploy: true`.

Removing a folder from `include` and re-running **unpublishes** it - the sync
prunes anything in the target that is no longer allowlisted. That is the
intended way to take something down.

## Watch

```bash
node scripts/watch-vault.mjs            # honours the config's deploy setting
node scripts/watch-vault.mjs --no-deploy
```

## Run it in the background

On macOS, a LaunchAgent at
`~/Library/LaunchAgents/com.studykit.vault-sync.plist` with `RunAtLoad` and
`KeepAlive` keeps the watcher alive across restarts.

```bash
launchctl load ~/Library/LaunchAgents/com.studykit.vault-sync.plist
launchctl unload ~/Library/LaunchAgents/com.studykit.vault-sync.plist
```

Send stdout and stderr to a log file and **read it after a deploy** rather than
assuming the deploy happened. A watcher that died three days ago looks exactly
like a watcher with nothing to do.

## Pausing

Set `"deploy": false`, or unload the agent. Both stop publishing immediately;
neither deletes what is already live. To take live content down, remove it from
`include` and run the sync once more.

## Deploy target

Vercel, from the site directory. **Gate it** - a study site carries scope notes,
schedules, and results. Password protection or an auth check is the default;
fully public is a decision the student makes out loud.
