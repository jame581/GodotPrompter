---
name: input-handling
description: Use when implementing input — InputEvent system, Input Map actions, controllers/gamepads, mouse/touch, action rebinding, and input architecture
---

# Input Handling in Godot 4.3+

All examples target Godot 4.3+ with no deprecated APIs. GDScript is shown first, then C#.

> **Related skills:** **player-controller** for movement driven by input, **godot-ui** for UI input focus and navigation, **save-load** for persisting custom key bindings, **responsive-ui** for touch vs desktop input adaptation, **xr-development** for XR controller and hand tracking input, **mobile-development** for mobile sensors and app lifecycle.

---

## 1. Core Concepts

### Input Flow

```
Hardware Event (key, mouse, gamepad)
    ↓
Engine converts to InputEvent
    ↓
_input()              ← raw input, runs first
    ↓
UI Control nodes      ← _gui_input: buttons, sliders consume events
    ↓
_shortcut_input()     ← for global shortcuts
    ↓
_unhandled_key_input() ← unhandled key-only events
    ↓
_unhandled_input()    ← game input (movement, actions)
```

### Where to Handle Input

| Method | Use For | When It Runs |
|---------------------------|--------------------------------------------|------------------|
| `_input()` | Camera look, global hotkeys | First — before everything |
| `_shortcut_input()` | Global shortcuts (pause, screenshot) | After UI, before unhandled |
| `_unhandled_key_input()` | Key-only events that UI didn't consume | After UI, keys only |
| `_unhandled_input()` | Gameplay actions (jump, attack, interact) | Last — after UI consumes |
| `Input.is_action_pressed()` in `_physics_process()` | Continuous movement | N/A — polling, not event-driven |

**Rule of thumb:** Use `_unhandled_input()` for discrete game actions (jump, attack). Use `Input` polling in `_physics_process()` for continuous movement. Use `_input()` only when you need input before UI consumes it (e.g., mouse look).

### InputEvent Hierarchy

```
InputEvent
├── InputEventFromWindow
│   ├── InputEventWithModifiers
│   │   ├── InputEventKey            ← keyboard
│   │   ├── InputEventMouse
│   │   │   ├── InputEventMouseButton ← mouse clicks
│   │   │   └── InputEventMouseMotion ← mouse movement
│   │   └── InputEventGesture        ← Magnify / Pan gestures
│   ├── InputEventScreenTouch        ← touchscreen tap
│   └── InputEventScreenDrag         ← touchscreen drag
├── InputEventJoypadButton     ← gamepad buttons
├── InputEventJoypadMotion     ← gamepad sticks/triggers
├── InputEventAction           ← synthetic action events
├── InputEventMIDI             ← MIDI devices
└── InputEventShortcut
```

---

## 2. Input Map Setup

Define actions in **Project > Project Settings > Input Map** instead of checking raw keycodes. This decouples game logic from specific keys and enables rebinding.

### Default Project Actions

Godot ships with `ui_*` actions: `ui_accept`, `ui_cancel`, `ui_left`, `ui_right`, `ui_up`, `ui_down`, etc. These are used by UI controls for keyboard navigation. You can use them for gameplay but creating custom actions is preferred to avoid conflicts.

### Adding Actions in Code

Actions can be created at runtime with `InputMap.add_action()` + `InputMap.action_add_event()` — typically in an autoload `_ready()`, guarded by `InputMap.has_action()`. Define actions in the editor Input Map; only add them in code for dynamically generated bindings or mod support.

> See [references/action-rebinding.md](references/action-rebinding.md) for the GDScript and C# snippet.

### Recommended Action Names

Use descriptive, game-specific names instead of key names:

| Good | Bad | Why |
|---------------------|------------------|--------------------------------------|
| `move_left` | `press_a` | Decoupled from physical key |
| `attack` | `left_click` | Works for mouse and gamepad |
| `interact` | `press_e` | Rebindable without changing logic |
| `sprint` | `hold_shift` | Input-agnostic |
| `pause` | `press_escape` | Can map to gamepad Start button too |

---

## 3. Reading Input — Events vs Polling

### Event-Driven (Discrete Actions)

Use `_unhandled_input()` for one-shot actions: jump, attack, interact, pause.

#### GDScript

```gdscript
func _unhandled_input(event: InputEvent) -> void:
    if event.is_action_pressed("jump"):
        _jump()
        get_viewport().set_input_as_handled()  # prevent further propagation

    if event.is_action_pressed("interact"):
        _interact()

    if event.is_action_pressed("pause"):
        get_tree().paused = not get_tree().paused
        get_viewport().set_input_as_handled()
```

#### C#

```csharp
public override void _UnhandledInput(InputEvent @event)
{
    if (@event.IsActionPressed("jump"))
    {
        Jump();
        GetViewport().SetInputAsHandled();
    }

    if (@event.IsActionPressed("interact"))
        Interact();

    if (@event.IsActionPressed("pause"))
    {
        GetTree().Paused = !GetTree().Paused;
        GetViewport().SetInputAsHandled();
    }
}
```

### Polling (Continuous Input)

Use `Input` singleton in `_physics_process()` for held buttons and analog axes.

#### GDScript

```gdscript
func _physics_process(delta: float) -> void:
    # Movement vector from 4 directional actions
    var direction := Input.get_vector("move_left", "move_right", "move_up", "move_down")
    velocity = direction * speed

    # Check if a button is held
    if Input.is_action_pressed("sprint"):
        velocity *= 1.5

    move_and_slide()
```

#### C#

```csharp
public override void _PhysicsProcess(double delta)
{
    Vector2 direction = Input.GetVector("move_left", "move_right", "move_up", "move_down");
    Velocity = direction * Speed;

    if (Input.IsActionPressed("sprint"))
        Velocity *= 1.5f;

    MoveAndSlide();
}
```

### Key Input Methods

| Method | Returns | Use For |
|-----------------------------------|---------|--------------------------------------|
| `Input.is_action_pressed()` | `bool` | Held buttons (sprint, crouch, fire) |
| `Input.is_action_just_pressed()` | `bool` | One-shot triggers (jump, interact) |
| `Input.is_action_just_released()` | `bool` | Release triggers (variable jump cut) |
| `Input.get_action_strength()` | `float` | Analog pressure (0.0–1.0) |
| `Input.get_axis()` | `float` | Single axis (-1.0 to 1.0) |
| `Input.get_vector()` | `Vector2` | 2D direction, length capped at 1 |
| `event.is_action_pressed()` | `bool` | Check in `_unhandled_input` callback |
| `event.is_action_released()` | `bool` | Check in `_unhandled_input` callback |

> **`Input.is_action_just_pressed()` in `_physics_process()` reports a press on the next physics tick**, even if the key was already released — a low tick rate does not drop taps, but several presses inside one tick count once. When each press matters, catch it in `_unhandled_input()` and set a flag.

### Input Buffering

Buffer discrete actions so a press made shortly before it can take effect (jump just before landing) still counts: catch the action in `_unhandled_input()`, set a flag with a short timer (0.1 s is typical), and consume the flag in `_physics_process()`.

> See [references/input-buffering.md](references/input-buffering.md) for the full GDScript and C# jump-buffer implementation.

---

## 4. Mouse Input

`InputEventMouseMotion.relative` for camera look (with `Input.MOUSE_MODE_CAPTURED`), `InputEventMouseButton` for clicks. Mouse modes: `VISIBLE`, `HIDDEN`, `CAPTURED`, `CONFINED`. Custom cursor via `Input.set_custom_mouse_cursor(texture, shape, hotspot)`.

> See [references/mouse.md](references/mouse.md) for the full GDScript and C# recipes (camera-look with sensitivity + invert toggle, mouse-mode switching, button events, custom cursor with shape variants).

---

## 5. Controller / Gamepad Support

`Input.get_connected_joypads()` for runtime detection, `Input.joy_connection_changed` signal for hot-plug. Use Input Map actions with joypad button events for portability. Analog sticks: `Input.get_vector("left", "right", "up", "down", deadzone)` returns a length-clamped Vector2 with built-in deadzone.

> See [references/gamepad.md](references/gamepad.md) for the GDScript and C# recipes (controller detection, deadzone analog reading, vibration via `start_joy_vibration`, motion sensors, detecting last-input-device for UI prompt swapping).

> **Godot 4.7+:** Joypad motion sensors — `Input.get_joy_accelerometer(device)` / `get_joy_gyroscope(device)` (both `Vector3`), guarded by `has_joy_motion_sensors()` and enabled with `set_joy_motion_sensors_enabled()`; recipe in [references/gamepad.md](references/gamepad.md). Vibration is now queryable — `Input.has_joy_vibration(device)` plus `get_joy_vibration_strength/duration/remaining_duration()`. `JoyButton` gains `JOY_BUTTON_MISC2` (`21`) through `JOY_BUTTON_MISC6` (`25`) (C#: `JoyButton.Misc2`…). New project setting `input_devices/joypads/ignore_joypad_on_unfocused_application` (default `false`) ignores joypad input (including motion sensors) and LED changes and stops vibration while the app is unfocused.

---

## 6. Touch Input

`InputEventScreenTouch` for tap/release, `InputEventScreenDrag` for finger drag; multi-touch is tracked by `event.index`. To test on desktop, enable **Project Settings → Input Devices → Pointing → Emulate Touch From Mouse**; **Emulate Mouse From Touch** is on by default so UI works on touchscreens.

> See [references/touch.md](references/touch.md) for the touch event recipes (GDScript and C#) and the `VirtualJoystick` on-screen stick (Godot 4.7+).

---

## 7. Action Rebinding at Runtime

Three steps: (1) capture the user's chosen key via `_input` while in "rebinding" mode, (2) call `InputMap.action_erase_events(action)` then `InputMap.action_add_event(action, new_event)`, (3) persist via `ConfigFile` and reload on launch.

> See [references/action-rebinding.md](references/action-rebinding.md) for the full GDScript and C# rebinding flow including ConfigFile save/load and the typical "press a key" capture UI.

---

## 8. Consuming and Propagating Input

Input propagates in **reverse scene tree order** (the node lowest in the Scene dock first, root last); call `get_viewport().set_input_as_handled()` after consuming an event to stop it reaching other nodes. During pause, only nodes with `process_mode` `PROCESS_MODE_ALWAYS` or `PROCESS_MODE_WHEN_PAUSED` receive input.

> See [references/event-propagation.md](references/event-propagation.md) for the GDScript and C# recipes (stopping propagation, node processing order, receiving input while paused).

---

## 9. Common Pitfalls

| Symptom | Cause | Fix |
|--------------------------------------|--------------------------------------------------|--------------------------------------------------------------------|
| Action not recognized | Action name not defined in Input Map | Add the action in Project > Project Settings > Input Map |
| Fast repeated presses count once | `is_action_just_pressed()` polled in `_physics_process`; presses share one tick | Catch discrete actions in `_unhandled_input()` instead |
| Input still fires when UI is open | Using `_input()` instead of `_unhandled_input()` | Switch to `_unhandled_input()` so UI consumes events first |
| Mouse look works through menus | Mouse motion in `_input()` without mode check | Guard with `if Input.mouse_mode == Input.MOUSE_MODE_CAPTURED` |
| Gamepad stick drifts | Deadzone too low or not set | Set deadzone per-action in Input Map (0.2 is a good default) |
| Controller not detected | Not connected before game start | Connect `joy_connection_changed` signal, handle hot-plug |
| Key rebinding captures modifier keys | No filter for Shift/Ctrl/Alt alone | Skip events where keycode is a modifier key |
| Touch input doesn't work on desktop | "Emulate Touch From Mouse" is disabled | Enable in Project Settings > Input Devices > Pointing |
| Pause menu ignores input while paused | Node `process_mode` is `INHERIT` (pauses with parent) | Set pause menu to `PROCESS_MODE_ALWAYS` |
| Action triggers twice per press | Same action checked in both `_input` and `_unhandled_input` | Pick one callback per action |

> ⚠️ **Changed in Godot 4.7:** Mouse and keyboard device IDs changed from `0` to `InputEvent.DEVICE_ID_MOUSE` (`32`) and `InputEvent.DEVICE_ID_KEYBOARD` (`16`), because some joypads use `0` as their device ID. Code checking `event.device == 0` to detect keyboard/mouse input silently breaks — compare against the constants or check the event type (`event is InputEventKey`) instead. See the [4.7 migration guide](https://docs.godotengine.org/en/latest/tutorials/migrating/upgrading_to_godot_4.7.html).

---

## 10. Implementation Checklist

- [ ] All gameplay actions are defined in the Input Map — no raw keycodes in game logic
- [ ] Discrete actions (jump, attack) use `_unhandled_input()`, not polling in `_physics_process()`
- [ ] Continuous input (movement, sprint) uses `Input.get_vector()` / `Input.is_action_pressed()` in `_physics_process()`
- [ ] Mouse look guards on `Input.mouse_mode == MOUSE_MODE_CAPTURED` to avoid rotating through menus
- [ ] Each Input Map action has both keyboard and gamepad bindings for controller support
- [ ] Gamepad deadzone is set per-action in Input Map (new actions: 0.5 on 4.3, 0.2 from 4.4)
- [ ] Pause menu node has `process_mode = PROCESS_MODE_ALWAYS` to receive input while paused
- [ ] `get_viewport().set_input_as_handled()` is called after consuming events that shouldn't propagate
- [ ] Input device detection exists if showing keyboard vs gamepad UI prompts
- [ ] Key rebinding saves to and loads from `user://` on game launch
