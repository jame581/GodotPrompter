> ← Back to [SKILL.md](../SKILL.md)

# Steam Release Planning

[distribution-itch-steam.md](distribution-itch-steam.md) covers getting a build onto Steam. This file covers the release side: the fixed waits, review times, store assets, demo and Next Fest rules, and discount limits that decide the earliest date a Godot game can launch.

Every value below comes from the Steamworks documentation as of October 2026, and Valve changes these rules. Before committing a user to a date, re-read the source page named in each section and say so if a value has moved.

## Account and app fee

Source: `partner.steamgames.com/doc/gettingstarted/appfee` and `.../gettingstarted/onboarding`

- **Steam Direct fee:** USD 100 per app, recouped once the app reaches USD 1,000 Adjusted Gross Revenue.
- **Waiting period:** 21 days between paying the app fee and releasing that app.
- **Tax and identity check:** 10 to 15 business days. Tax information cannot be changed while it runs, so finish the tax interview carefully the first time.
- The fee creates the App ID, and the store page, depots and builds all hang off that App ID. Pay it first.

## Store page and reviews

Source: `.../store/coming_soon` and `.../store/review_process`

- The **Coming Soon** page must be public for **at least two weeks** before release. That is a floor: wishlists only accumulate while the page is public, so put it up as soon as there are honest gameplay screenshots.
- **Store page review** and **build review** each typically take 3 to 5 business days. Submit each at least 7 business days before the date it has to be live.
- Store page review checks that the page shows only what ships at launch, capsules carry a readable title or logo, screenshots are gameplay only, and the description is complete with no links to other websites.
- Build review checks that the game starts on **every OS listed** on the store page, that every feature listed in Basic Info works, and that in-game purchases use Steam Wallet. List Linux or controller support only once it is tested in the exported build.

## Working backwards from a launch date

The hard minimum, in order. "R" is the release date; business days are Monday to Friday.

| Step | Latest | Why |
|---|---|---|
| Pay app fee, start tax interview | R − 21 days, and before the store page review | 21-day wait; the App ID comes from the fee |
| Submit store page for review | 7 business days before Coming Soon | review takes 3 to 5 business days |
| Coming Soon page public | R − 14 days | two-week minimum |
| Submit release build for review | 7 business days before R | build review takes 3 to 5 business days |
| Set up the launch discount | before R | it cannot be added after release |

Chained, these put the app fee about four weeks before release at the very latest, and a new Steamworks account adds the 10 to 15 business day tax check before that. Treat them as the point of no return, not the plan: a page that goes live two weeks before launch collects almost no wishlists. If the user also wants Next Fest, its deadlines (below) usually come first and move every date earlier.

## Store and library assets

Source: `.../store/assets/standard` and `.../store/assets/libraryassets`

| Asset | Size (px) | Required | Rule |
|---|---|---|---|
| Header Capsule | 920 × 430 | yes | no text except the title |
| Small Capsule | 462 × 174 | yes | logo fills most of it, readable at 184 × 69 |
| Main Capsule | 1232 × 706 | yes | no text except the title |
| Vertical Capsule | 748 × 896 | yes | no text except the title |
| Screenshots | min. 1920 × 1080, 16:9 | at least 5 | gameplay only; mark at least 4 suitable for all ages |
| Page Background | 1438 × 810 | no | |
| Library Capsule | 600 × 900 | yes | no text except the title |
| Library Header | 920 × 430 | yes | falls back to the Header Capsule if unset |
| Library Hero | 3840 × 1240 | yes | no text at all; key content inside the centred 860 × 380 safe area |
| Library Logo | 1280 wide and/or 720 tall | yes | transparent PNG, logotype only |

Time-limited text such as "Out now" or an update banner goes in Artwork Overrides, which expire on their own, not in the standard capsules. A screenshot taken in-engine (`get_viewport().get_texture().get_image()`, C# `GetViewport().GetTexture().GetImage()`) has the viewport's rendered size, so capture from a 1920 × 1080 or larger 16:9 window.

## Demo and Next Fest

Source: `.../store/application/demos` and `.../marketing/upcoming_events/nextfest`

- A demo is a **separate App ID** linked to the base game, with its own depots, build and review. A separate demo store page is optional; without one the demo appears as a button on the base game's page.
- Export the demo from its own Godot export preset (for example a `demo` feature tag checked with `OS.has_feature("demo")`), not from a branch of the project.
- The demo's wishlist notification can be sent **once**, within **14 days** of the demo first becoming playable.
- **Next Fest** runs three times a year (February, June, October). A game can take part in **only one** edition, must stay unreleased until that edition ends, and needs a public store page and a public demo by the time it starts.
- Register from the **base game**, not the demo.
- Submit the demo for review **5 weeks** before the fest to be playable in the press preview (which opens 11 days before), and **3 weeks** before at the latest.

## Discounts and wishlist emails

Source: `.../marketing/discounts` and `.../marketing/wishlist`

- Discounts run from 10 to 95 %. A **launch discount** is at most 40 % and lasts 7 to 14 days.
- No discount for **30 days** after release (the launch discount aside), for 30 days after a price increase in any currency, or within 30 days of a previous discount. The launch discount starts that last cooldown too.
- Seasonal sales are exempt from the discount-to-discount cooldown, but a product still inside its release or price-increase cooldown cannot join one.
- Wishlisters are emailed at release (and again when leaving Early Access) and for discounts of at least 20 % that last more than 8 hours and cover the lowest-priced package. Wishlist emails have a 1 to 2 week cooldown, so space the demo, launch and first discount apart.

## Does the game need the Steamworks API?

Not to sell on Steam. A plain Godot export uploads and runs from Steam without GodotSteam. The API is needed for achievements, stats, leaderboards, Workshop, rich presence, the in-game overlay features and Steam networking. For a first release, shipping without it removes one source of build-review risk; add it in an update.

Saves can still sync without the API: point Steam Auto-Cloud at the directory `user://` resolves to — on Windows `%APPDATA%\Godot\app_userdata\<project name>`, or `%APPDATA%\<name>` when `application/config/use_custom_user_dir` is set. Print `OS.get_user_data_dir()` (C# `OS.GetUserDataDir()`) from the exported build to confirm the exact path before configuring it.
