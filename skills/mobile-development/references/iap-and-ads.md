# In-App Purchases & Ads

Back to [Mobile Development](../SKILL.md).

## Android: GodotGooglePlayBilling (Godot 4.2+, requires Gradle)

<!-- csharp-parity: n/a — the plugin is reached through a dynamic Engine singleton whose members are resolved at runtime; a C# port would be untyped Call()/Connect() string soup, and no first-party C# binding or example exists to verify it against. -->

The first-party **`GodotGooglePlayBilling`** plugin wraps the Play Billing Library. **Godot 4.2+ and the custom Gradle build are required.** (The official docs are GDScript-only.)

> **C# note:** there is no first-party C# binding. The plugin is a dynamic Engine singleton, so from C# every call goes through `Call("query_product_details", …)` and every signal through `Connect("on_purchase_updated", …)` — untyped and unverified against a real build. Wrap it once behind a typed C# service interface and keep the string-based calls in that one file.

Lifecycle: construct a `BillingClient`, connect its signals, then call `start_connection()`. Query helpers: `is_ready()`, `get_connection_state()` (`ConnectionState{DISCONNECTED, CONNECTING, CONNECTED, CLOSED}`).

```gdscript
var billing

func _ready():
    billing = BillingClient.new()
    billing.connected.connect(_on_connected)
    billing.disconnected.connect(_on_disconnected)
    billing.connect_error.connect(_on_connect_error)
    billing.query_product_details_response.connect(_on_product_details)
    billing.on_purchase_updated.connect(_on_purchase_updated)
    billing.start_connection()

func _on_connected():
    billing.query_product_details(["coins_100"], BillingClient.ProductType.INAPP)

func _on_product_details(response):
    if response.response_code == BillingClient.BillingResponseCode.OK:
        billing.purchase("coins_100")

func _on_purchase_updated(response):
    for purchase in response.purchases:
        if purchase.purchase_state == BillingClient.PurchaseState.PURCHASED:
            _grant_items(purchase)              # Never award PENDING.
            billing.consume_purchase(purchase.purchase_token)  # Consumable.
            # For non-consumables: billing.acknowledge_purchase(purchase.purchase_token)
```

**Signals:** `connected`, `disconnected`, `connect_error(code, msg)`, `query_product_details_response(resp)`, `query_purchases_response(resp)`, `on_purchase_updated(resp)`, `consume_purchase_response`, `acknowledge_purchase_response`.

**Methods:** `query_product_details(ids, type)`, `query_purchases(type)`, `purchase(product_id)`, `purchase_subscription(...)`, `consume_purchase(token)`, `acknowledge_purchase(token)`.

**Types:** `ProductType.INAPP` / `.SUBS`, `BillingResponseCode.OK`, `PurchaseState{UNSPECIFIED, PURCHASED, PENDING}`.

**Rules:**

- Query product details before calling `purchase`.
- **Acknowledge one-time purchases within 3 days** or Google auto-refunds them.
- `consume_purchase` auto-acknowledges (use it for consumables); `acknowledge_purchase` for non-consumables/subscriptions.
- **Never award a `PENDING` purchase** — wait for `PURCHASED`.

## iOS IAP

There is **no documented first-party API** for iOS in-app purchases — StoreKit is reached through a third-party or custom **iOS plugin** (see [Plugins](plugins.md)). Wrap the StoreKit flow behind the same service abstraction you use for Android so game code stays platform-agnostic.

## Ads

Godot ships no first-party ad SDK. AdMob, Unity Ads, etc. are integrated as Android v2 / iOS plugins (see [Plugins](plugins.md)). Put every ad call behind the same service-abstraction interface you use for IAP so each platform's plugin is swappable and game code never references a vendor SDK directly.
