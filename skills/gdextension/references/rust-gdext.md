# Rust alternative — godot-rust / gdext

> **Community, not official.** [godot-rust/gdext](https://github.com/godot-rust/gdext) is a community-maintained Rust binding (MPL-2.0). Maintained releases require **Godot 4.2+** (4.1 support is frozen). The official native binding is godot-cpp (C++) — see the parent [GDExtension](../SKILL.md) skill.

## Cargo.toml

A gdext extension is a `cdylib` crate that depends on the `godot` crate:

```toml
[lib]
crate-type = ["cdylib"]

[dependencies]
godot = "0.x.y"
```

## Library entry point

Instead of the C++ `extern "C"` init function, gdext uses the `#[gdextension]` attribute on an `ExtensionLibrary` impl:

```rust
use godot::prelude::*;

struct MyExtension;

#[gdextension]
unsafe impl ExtensionLibrary for MyExtension {}
```

## Declaring a class

`#[derive(GodotClass)]` registers the type; `#[class(init, base=...)]` picks the base class and auto-generates a constructor. `#[init(val = ...)]` gives a field a default:

```rust
#[derive(GodotClass)]
#[class(init, base=Sprite2D)]
struct Player {
    base: Base<Sprite2D>,
    #[init(val = 100)]
    hitpoints: i32,
}
```

## Methods, virtuals, and signals

Implement the engine virtual trait (`ISprite2D`, etc.) for lifecycle callbacks, and a plain `impl` block for your own API. `#[func]` exposes a method to Godot; `#[signal]` declares a signal:

```rust
#[godot_api]
impl ISprite2D for Player {
    fn ready(&mut self) {
        godot_print!("Player ready!");
    }
}

#[godot_api]
impl Player {
    #[func]
    fn take_damage(&mut self, damage: i32) {
        // ...
    }

    #[signal]
    fn got_message();
}
```

## The .gdextension file

The configuration is the same as the C++ case **except the entry symbol** — gdext exports a fixed symbol:

```ini
[configuration]
entry_symbol = "gdext_rust_init"
compatibility_minimum = "4.2"
```

Since Godot 4.2, gdext extensions load on any Godot where the runtime version is greater than or equal to the API version they were built against.
