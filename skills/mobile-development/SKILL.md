---
name: mobile-development
description: Use when targeting Android/iOS — export and signing, permissions, plugins, in-app purchases, ads, app lifecycle, device features, and mobile performance
---

# Mobile Development

Ship a Godot 4.x game to Android and iOS. This covers the platform-specific deltas beyond a generic export: signing, lifecycle, permissions, plugins, IAP, device features, and the mobile renderer/perf budget.

> **Related skills:** **export-pipeline** for the generic export flow and CI/CD, **responsive-ui** for safe-area layout, **input-handling** for touch, **godot-optimization** for mobile performance, **csharp-godot** for C# mobile caveats.

---

## 1. Export & signing

**Android:** OpenJDK 17 and the Android SDK; set `Java SDK Path` + `Android SDK Path` in **Editor Settings** (per-user, not per-project). Generate a release keystore:

```bash
keytool -v -genkey -keystore mygame.keystore -alias mygame -keyalg RSA -validity 10000
```

Preset fields: **Release / Release User / Release Password** (keystore and key passwords must currently match); uncheck **Export With Debug**. **AAB is mandatory for new Play uploads.** CI env overrides: `GODOT_ANDROID_KEYSTORE_RELEASE_{PATH,USER,PASSWORD}`.

**iOS:** macOS + Xcode. Export needs an **App Store Team ID** + a reverse-DNS bundle **Identifier**; Godot generates an `.xcodeproj` you build from Xcode. The iOS **simulator supports the Compatibility renderer only**.

A **custom Gradle build** (*Project → Install the Gradle Build template*) is **required for v2 plugins and IAP** (Godot 4.2+). Since Godot 4.7 the **Use Gradle Build** export option is no longer marked experimental ([GH-119172](https://github.com/godotengine/godot/pull/119172)) — treat it as the standard path when you need plugins or IAP.

> ⚠️ **Changed in Godot 4.7:** Deprecated Google Play OBB expansion-file support was removed from the Android export. Projects still relying on APK expansion files must migrate to Play Asset Delivery or PCK patching. See [GH-118283](https://github.com/godotengine/godot/pull/118283).

---

## 2. App lifecycle

Real `Node` notification constants: `NOTIFICATION_APPLICATION_PAUSED` (2015), `NOTIFICATION_APPLICATION_RESUMED` (2014), `NOTIFICATION_APPLICATION_FOCUS_IN`/`_OUT` (2016/2017), `NOTIFICATION_WM_GO_BACK_REQUEST` (1007, Android Back). **There is no `WM_CLOSE_REQUEST` on mobile.** Autosave on PAUSED; **iOS gives ~5 s** after pause to finish work before it kills the app.

### GDScript

```gdscript
func _notification(what: int) -> void:
    match what:
        NOTIFICATION_APPLICATION_PAUSED:
            SaveManager.save_game() # App backgrounded — persist now.
        NOTIFICATION_WM_GO_BACK_REQUEST:
            _confirm_quit()         # Android Back button.
```

### C# Equivalent

The docs only show `NotificationWMCloseRequest` verbatim; these PascalCase names follow the same convention.

```csharp
public override void _Notification(int what)
{
    switch ((long)what)
    {
        case NotificationApplicationPaused:
            SaveManager.SaveGame(); // App backgrounded — persist now.
            break;
        case NotificationWMGoBackRequest:
            ConfirmQuit();          // Android Back button.
            break;
    }
}
```

### Picture-in-Picture (Android, Godot 4.7+)

`DisplayServer.pip_mode_enter(window_id = 0)` enters picture-in-picture mode; `is_in_pip_mode(window_id = 0)` reports the current state; `pip_mode_set_aspect_ratio(numerator, denominator, window_id = 0)` sets the PiP window's aspect ratio; `pip_mode_set_auto_enter_on_background(auto_enter_on_background, window_id = 0)` enters PiP automatically when the app goes to the background. Transitions arrive as `Node` notifications: `NOTIFICATION_APPLICATION_PIP_MODE_ENTERED` (2019) / `NOTIFICATION_APPLICATION_PIP_MODE_EXITED` (2020). All Android-only.

```gdscript
func _ready() -> void:
    DisplayServer.pip_mode_set_aspect_ratio(16, 9)
    DisplayServer.pip_mode_set_auto_enter_on_background(true)

func _notification(what: int) -> void:
    match what:
        NOTIFICATION_APPLICATION_PIP_MODE_ENTERED:
            _set_minimal_hud(true)  # PiP window is tiny — hide non-essential UI.
        NOTIFICATION_APPLICATION_PIP_MODE_EXITED:
            _set_minimal_hud(false)
```

```csharp
public override void _Ready()
{
    DisplayServer.PipModeSetAspectRatio(16, 9);
    DisplayServer.PipModeSetAutoEnterOnBackground(true);
}

public override void _Notification(int what)
{
    switch ((long)what)
    {
        case NotificationApplicationPipModeEntered:
            SetMinimalHud(true);  // PiP window is tiny — hide non-essential UI.
            break;
        case NotificationApplicationPipModeExited:
            SetMinimalHud(false);
            break;
    }
}
```

---

## 3. Permissions

Declare each permission in the export preset as `permissions/<name>`; request it at runtime with `OS.request_permission(name)`. The result arrives via `MainLoop`'s `on_request_permissions_result(permission, granted)`. The permission **must also be enabled in the preset**, not just requested.

### GDScript

```gdscript
func _ready():
    if "android.permission.POST_NOTIFICATIONS" not in OS.get_granted_permissions():
        OS.request_permission("android.permission.POST_NOTIFICATIONS")
    get_tree().on_request_permissions_result.connect(_on_perm_result)

func _on_perm_result(permission: String, granted: bool):
    print("%s granted: %s" % [permission, granted])
```

### C# Equivalent

```csharp
public override void _Ready()
{
    if (!OS.GetGrantedPermissions().Contains("android.permission.POST_NOTIFICATIONS"))
        OS.RequestPermission("android.permission.POST_NOTIFICATIONS");
    GetTree().OnRequestPermissionsResult += OnPermResult;
}

private void OnPermResult(string permission, bool granted)
    => GD.Print($"{permission} granted: {granted}");
```

---

## 4. Calling Android APIs (JavaClassWrapper) — Godot 4.4+

**Godot 4.4+ only.** `JavaClassWrapper.wrap("<java.class>")` calls Java/Kotlin classes with no plugin; the `AndroidRuntime` singleton (`Engine.get_singleton("AndroidRuntime")`) exposes `getActivity()`, `getApplicationContext()`, and `createRunnableFromGodotCallable(callable)`.

The simpler cross-platform alternative needs no 4.4: `Input.vibrate_handheld(duration_ms, amplitude)` (requires the `VIBRATE` permission; iOS needs iOS 13+). See [Plugins](references/plugins.md) for the full JavaClassWrapper/AndroidRuntime API, Toast/Intent recipes, and inner-class syntax.

### GDScript

```gdscript
# Godot 4.4+ — requires the VIBRATE permission in the export preset.
func vibrate_ms(duration_ms: int) -> void:
    if Engine.has_singleton("AndroidRuntime"):
        var runtime := Engine.get_singleton("AndroidRuntime")
        var context := runtime.getApplicationContext()
        var vibrator := context.getSystemService("vibrator")
        if vibrator.hasVibrator():
            var Effect = JavaClassWrapper.wrap("android.os.VibrationEffect")
            var effect = Effect.createOneShot(duration_ms, Effect.DEFAULT_AMPLITUDE)
            vibrator.vibrate(effect)
```

### C# Equivalent

The docs are GDScript-only here; the exact C# Variant-marshaling chain (`.AsGodotObject()` on each Java return) is untested against a device — verify on a real 4.4+ Android build.

```csharp
// Godot 4.4+ — requires the VIBRATE permission in the export preset.
public void VibrateMs(int durationMs)
{
    if (!Engine.HasSingleton("AndroidRuntime")) return;
    var runtime = Engine.GetSingleton("AndroidRuntime");
    var context = runtime.Call("getApplicationContext").AsGodotObject();
    var vibrator = context.Call("getSystemService", "vibrator").AsGodotObject();
    if (vibrator.Call("hasVibrator").AsBool())
    {
        var effect = JavaClassWrapper.Wrap("android.os.VibrationEffect");
        var oneShot = effect.Call("createOneShot", durationMs, effect.Get("DEFAULT_AMPLITUDE"));
        vibrator.Call("vibrate", oneShot);
    }
}
```

### Implementing Java Interfaces from Script (Godot 4.7+)

`JavaClassWrapper.create_proxy(object: Object, interfaces: PackedStringArray) -> JavaObject` implements the given Java interfaces using a Godot object — the object's method signatures must match the Java interfaces' method signatures, and Java calls route to the matching method. `create_sam_callback(sam_interface: String, callable: Callable) -> JavaObject` covers single-abstract-method (SAM) interfaces with a `Callable` matching the SAM method's parameters and return type. Both return `null` on every platform except Android.

```gdscript
class PrintProxy:
    func println(content: String) -> void:
        print(content)

func _demo() -> void:
    var print_proxy := PrintProxy.new()
    var printer := JavaClassWrapper.create_proxy(print_proxy, ["android.util.Printer"])
    printer.println("Hello Godot World!")

    var cb := func(content: String) -> void: print(content)
    var callback := JavaClassWrapper.create_sam_callback("android.util.Printer", cb)
    callback.println("Hello Godot World!")
```

The docs are GDScript-only here. `CreateProxy` matches methods by their registered name, so a C# implementation class would need method names matching the Java interface exactly — prefer `CreateSamCallback` from C#:

```csharp
var cb = Callable.From((string content) => GD.Print(content));
var callback = JavaClassWrapper.CreateSamCallback("android.util.Printer", cb);
callback.Call("println", "Hello Godot World!");
```

---

## 5. Device features & safe area

`DisplayServer.get_display_safe_area() -> Rect2i` (Android/iOS) returns the usable region inside notches/cutouts; `get_display_cutouts()` (Android) lists the cutout rects. Motion sensors live on `Input` (`get_accelerometer/gravity/gyroscope/magnetometer`, returning `Vector3`, Android/iOS only).

### GDScript

```gdscript
func _ready():
    var safe := DisplayServer.get_display_safe_area() # Rect2i
    $UI.position = safe.position
    $UI.size = safe.size
```

### C# Equivalent

```csharp
public override void _Ready()
{
    Rect2I safe = DisplayServer.GetDisplaySafeArea();
    var ui = GetNode<Control>("UI");
    ui.Position = safe.Position;
    ui.Size = safe.Size;
}
```

Native file dialogs (`DisplayServer.file_dialog_show()`) are supported on Android; since Godot 4.7 the native file picker works on all devices — the Android version check gating `FEATURE_NATIVE_DIALOG_FILE` support was removed ([GH-115257](https://github.com/godotengine/godot/pull/115257)).

> **Godot 4.7+:** For on-screen touch joysticks, use the built-in `VirtualJoystick` Control node instead of a hand-rolled `TouchScreenButton` rig — see **input-handling** (§ 6, "VirtualJoystick (Godot 4.7+)") for the full API.

### Device Orientation Signal (Godot 4.7+)

`DisplayServer.orientation_changed(orientation: int)` (Android/iOS) fires when the device orientation changes: `1` portrait, `2` landscape, `0` undefined.

```gdscript
func _ready() -> void:
    DisplayServer.orientation_changed.connect(_on_orientation_changed)

func _on_orientation_changed(orientation: int) -> void:
    _relayout_hud(orientation == 2)  # 1 portrait, 2 landscape, 0 undefined.
```

```csharp
public override void _Ready()
{
    DisplayServer.Singleton.Connect(DisplayServer.SignalName.OrientationChanged,
        Callable.From((long orientation) => RelayoutHud(orientation == 2)));
}
```

---

## 6. Mobile performance & renderer

Use the **Mobile** (or **Compatibility**) renderer; the iOS simulator is Compatibility-only. Enable `rendering/textures/vram_compression/import_etc2_astc = true` (ETC2/ASTC) for Android texture compression. Keep single-arch APKs small; AABs split per-device automatically. Defer deep draw-call/batching tuning to **godot-optimization**.

---

## 7. C# on mobile

C# Android/iOS export is **Godot 4.2+ but experimental**. **Android C# export requires .NET 9+** (with Godot 4.5); iOS export only from macOS, and the simulator templates are x64-only. **C# cannot export to Web.** Test the C# export pipeline early — it is the riskiest part of a C# mobile project.

> **Deeper:** [Plugins (Android v2 / iOS)](references/plugins.md) · [In-app purchases & ads](references/iap-and-ads.md) · [Crash debugging](references/crash-debugging.md)

---

## Implementation Checklist

- [ ] Release keystore (Android) / provisioning + Team ID (iOS) configured
- [ ] AAB for Play uploads; Gradle build installed if using v2 plugins or IAP
- [ ] Autosave wired to `NOTIFICATION_APPLICATION_PAUSED` (iOS ~5 s budget respected)
- [ ] Required permissions enabled in the preset AND requested at runtime
- [ ] JavaClassWrapper usage labeled Godot 4.4+; fallbacks for 4.3 if needed
- [ ] UI anchored inside `get_display_safe_area()`; notch/cutout handled
- [ ] Mobile/Compatibility renderer + ETC2/ASTC compression enabled
- [ ] C# projects: verified .NET 9+ for Android export
- [ ] Play OBB/APK expansion files migrated to Play Asset Delivery or PCK patching (removed in Godot 4.7)
- [ ] PiP (Android): aspect ratio + auto-enter configured; HUD reacts to the PIP_MODE notifications (Godot 4.7+)
