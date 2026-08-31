# Screenshot inventory and privacy rules

The README follows the visual inventory of the original PokeTokenBar project, adapted for Windows.

## Required demo captures

| File | What it should show | Privacy requirements |
| --- | --- | --- |
| `screenshot-home.png` | Home popover, synthetic provider rows, egg or active companion, local-only limit notice | No real totals, costs, provider paths, username, or taskbar identity |
| `tray-and-popover.png` | Neutral illustration of the Windows notification-area icon and opened Home popover | Must be visibly labelled as an illustration; do not capture unrelated tray icons, clock, notifications, or personal app names |
| `floating-pet.png` | Static capture of the floating companion window | Synthetic Pokémon state only; no desktop content behind it |
| `shiny-banner.png` | Static capture of a shiny companion state | No account data or real event history |
| `screenshot-collection-pokedex.png` | Pokédex grid with synthetic collected entries | No real catch dates or exported state |
| `screenshot-collection-catchlog.png` | Catch Log with synthetic dates and natures | Use neutral demo dates and names only |
| `settings.png` | Settings sections, update check, privacy controls, tray behavior options | No selected personal folders; no user name in path text |
| `screenshot-bag.png` | Bag with Rare Candy, Mint, and synthetic inventory counts | No real wallet or purchase history |
| `screenshot-shop.png` | Shop items and synthetic prices | Prices are demo UI values, not account data |
| `screenshot-scan-folders.png` | Settings → Advanced → additional scan folders | Show a demo path such as `C:\Demo\AI-Logs`; never show a real path |

## Capture method

Prefer the packaged app launched with an isolated temporary state directory and isolated empty provider roots. If a real desktop capture is necessary, create a clean Windows user/profile or crop and redact the entire surrounding desktop before saving.

Before adding an image:

1. inspect every visible pixel for usernames, home paths, clock/notification content, window titles, account values, and personal project names;
2. confirm the file is under `docs/images/`, not `assets/`;
3. confirm the image is excluded from the packaged application;
4. record that it was generated with synthetic values;
5. remove the temporary demo profile and any untracked capture files outside `docs/images/`.

Never use the user's live Hermes database or provider logs to produce a screenshot.
