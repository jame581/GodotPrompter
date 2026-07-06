# Inspector Plugins & Custom Resource Editors

Reference for `skills/addon-development/SKILL.md` — `EditorInspectorPlugin` for custom property widgets, `EditorResourcePicker` for typed resource pickers, and `EditorResourcePreviewGenerator` for custom thumbnails. GDScript first; **C# parity added in v1.7.0 Tasks 17 and 18**.

> ← Back to [SKILL.md](../SKILL.md)

---

## 4. Custom Inspector Plugin

`EditorInspectorPlugin` lets you replace or augment how specific node or resource types appear in the Inspector. Register it from your `EditorPlugin` and unregister on exit.

### GDScript

```gdscript
# my_inspector_plugin.gd
@tool
extends EditorInspectorPlugin

# Return true if this plugin should handle the given object.
# Called once when the Inspector selects a new object.
func _can_handle(object: Object) -> bool:
    return object is MyNode  # only handle MyNode instances


# Called before any properties are drawn. Insert controls at the top
# of the Inspector section for this object.
func _parse_begin(object: Object) -> void:
    var label := Label.new()
    label.text = "MyNode Inspector"
    label.add_theme_color_override("font_color", Color.CYAN)
    add_custom_control(label)


# Called for every exported property. Return true to suppress the
# default property editor and replace it with your own controls.
func _parse_property(
    object: Object,
    type: Variant.Type,
    name: String,
    hint_type: PropertyHint,
    hint_string: String,
    usage_flags: int,
    wide: bool
) -> bool:
    if name == "my_special_value":
        # Add a custom button instead of the default numeric field.
        var btn := Button.new()
        btn.text = "Reset to Default"
        btn.pressed.connect(func() -> void:
            object.my_special_value = 0
            # Notify the editor that a property changed so undo/redo works.
            emit_signal("property_changed", name, 0)
        )
        add_custom_control(btn)
        return true  # suppress default editor for this property

    return false  # use default editor for all other properties
```

Register and unregister the plugin in your main `EditorPlugin`:

```gdscript
# plugin.gd
@tool
extends EditorPlugin

var _inspector_plugin: EditorInspectorPlugin


func _enter_tree() -> void:
    _inspector_plugin = preload("res://addons/my_plugin/my_inspector_plugin.gd").new()
    add_inspector_plugin(_inspector_plugin)


func _exit_tree() -> void:
    remove_inspector_plugin(_inspector_plugin)
```

**EditorInspectorPlugin method summary:**

| Method | When called | Return value |
|---|---|---|
| `_can_handle(object)` | On Inspector selection | `true` to claim the object |
| `_parse_begin(object)` | Before first property | — |
| `_parse_end(object)` | After last property | — |
| `_parse_category(object, category)` | At each category header | — |
| `_parse_group(object, group)` | At each group header | — |
| `_parse_property(...)` | Per property | `true` to hide default editor |

### C#

```csharp
// res://addons/my_plugin/MyInspectorPlugin.cs
#if TOOLS
using Godot;

[Tool]
public partial class MyInspectorPlugin : EditorInspectorPlugin
{
    public override bool _CanHandle(GodotObject @object)
    {
        // Return true for the types this inspector should customize.
        return @object is ItemData;
    }

    public override bool _ParseProperty(
        GodotObject @object,
        Variant.Type type,
        string name,
        PropertyHint hintType,
        string hintString,
        PropertyUsageFlags usageFlags,
        bool wide)
    {
        // Inject a custom EditorProperty for the "icon" property of ItemData.
        if (name == "icon")
        {
            AddPropertyEditor(name, new IconPreviewProperty());
            return true; // we handled this property — skip default rendering
        }
        return false;
    }
}

// res://addons/my_plugin/IconPreviewProperty.cs
[Tool]
public partial class IconPreviewProperty : EditorProperty
{
    private TextureRect _preview;

    public IconPreviewProperty()
    {
        _preview = new TextureRect { ExpandMode = TextureRect.ExpandModeEnum.FitWidthProportional };
        AddChild(_preview);
        SetBottomEditor(_preview);
    }

    public override void _UpdateProperty()
    {
        var item = (ItemData)GetEditedObject();
        _preview.Texture = item?.Icon;
    }
}
#endif

// Register in your main EditorPlugin (Plugin.cs):
//
// #if TOOLS
// using Godot;
//
// [Tool]
// public partial class Plugin : EditorPlugin
// {
//     private MyInspectorPlugin _inspector;
//
//     public override void _EnterTree()
//     {
//         _inspector = new MyInspectorPlugin();
//         AddInspectorPlugin(_inspector);
//     }
//
//     public override void _ExitTree()
//     {
//         RemoveInspectorPlugin(_inspector);
//     }
// }
// #endif
```

### Embedding a Default Inspector (Godot 4.7+)

The static `EditorInspector.create_default_inspector(filter_line_edit: LineEdit = null)` creates an inspector with the same configuration as the one used in the editor's Inspector dock — no manual setup of categories, plugins, or property editors. When you pass a `LineEdit` into `filter_line_edit`, the inspector filters its properties based on `LineEdit.text` whenever `text_changed` is emitted. Useful for dock panels or tool dialogs that need a full inspector for an arbitrary object.

```gdscript
# Inside a dock or editor tool scene
@tool
extends VBoxContainer

var _inspector: EditorInspector


func _ready() -> void:
    var filter := LineEdit.new()
    filter.placeholder_text = "Filter properties"
    add_child(filter)

    # Fully configured default inspector; the LineEdit drives live filtering.
    _inspector = EditorInspector.create_default_inspector(filter)
    _inspector.size_flags_vertical = Control.SIZE_EXPAND_FILL
    add_child(_inspector)


func show_object(object: Object) -> void:
    _inspector.edit(object)
```

```csharp
// res://addons/my_plugin/EmbeddedInspectorPanel.cs
#if TOOLS
using Godot;

[Tool]
public partial class EmbeddedInspectorPanel : VBoxContainer
{
    private EditorInspector _inspector;

    public override void _Ready()
    {
        var filter = new LineEdit { PlaceholderText = "Filter properties" };
        AddChild(filter);

        // Fully configured default inspector; the LineEdit drives live filtering.
        _inspector = EditorInspector.CreateDefaultInspector(filter);
        _inspector.SizeFlagsVertical = Control.SizeFlags.ExpandFill;
        AddChild(_inspector);
    }

    public void ShowObject(GodotObject @object)
    {
        _inspector.Edit(@object);
    }
}
#endif
```

---

## 6. Custom Resource Editors

### EditorResourcePicker

`EditorResourcePicker` is the drop-down widget used in the Inspector for `Resource`-typed properties. This is an **editor-only** widget for building custom tooling — it cannot be used in runtime UI. You can embed it in your dock or inspector plugin to let users assign resources interactively.

```gdscript
# Inside a dock or editor tool scene
@tool
extends VBoxContainer

var _picker: EditorResourcePicker


func _ready() -> void:
    _picker = EditorResourcePicker.new()
    _picker.base_type = "Texture2D"      # restrict to Texture2D and subclasses
    _picker.resource_changed.connect(_on_resource_changed)
    add_child(_picker)


func _on_resource_changed(resource: Resource) -> void:
    if resource:
        print("Selected texture: ", resource.resource_path)
```

### Custom Resource Previews

Implement `EditorResourcePreviewGenerator` to show thumbnails for your custom resource types in the FileSystem panel and Inspector.

```gdscript
# my_preview_generator.gd
@tool
extends EditorResourcePreviewGenerator


# Return true if this generator handles the given type.
func _handles(type: String) -> bool:
    return type == "MyItemData"


# Generate a Texture2D thumbnail for the resource.
# size is the requested pixel size (typically 64 or 128).
func _generate(resource: Resource, size: Vector2i, metadata: Dictionary) -> Texture2D:
    var item := resource as MyItemData
    if item == null or item.icon == null:
        return null

    # Return the item's icon scaled to the requested size.
    var img: Image = item.icon.get_image().duplicate()
    img.resize(size.x, size.y, Image.INTERPOLATE_LANCZOS)
    return ImageTexture.create_from_image(img)


# Optional — generate from a path instead of a loaded resource.
# Return null to fall back to _generate.
func _generate_from_path(path: String, size: Vector2i, metadata: Dictionary) -> Texture2D:
    return null
```

Register the generator from your `EditorPlugin`:

```gdscript
var _preview_gen: EditorResourcePreviewGenerator

func _enter_tree() -> void:
    _preview_gen = preload("res://addons/my_plugin/my_preview_generator.gd").new()
    EditorInterface.get_resource_previewer().add_preview_generator(_preview_gen)

func _exit_tree() -> void:
    EditorInterface.get_resource_previewer().remove_preview_generator(_preview_gen)
```

### C#

```csharp
// res://addons/my_plugin/ItemResourcePicker.cs
#if TOOLS
using Godot;

[Tool]
public partial class ItemResourcePicker : EditorResourcePicker
{
    public ItemResourcePicker()
    {
        BaseType = "ItemData";
        EditableWarning = "Editing this Resource affects all scenes that reference it.";
    }
}

// res://addons/my_plugin/ItemPreviewGenerator.cs
[Tool]
public partial class ItemPreviewGenerator : EditorResourcePreviewGenerator
{
    public override bool _Handles(string type)
    {
        return type == "ItemData";
    }

    public override Texture2D _Generate(Resource resource, Vector2I size, Godot.Collections.Dictionary metadata)
    {
        var item = resource as ItemData;
        if (item?.Icon == null)
            return null;

        // Return a thumbnail; the editor will cache it.
        return item.Icon;
    }

    public override bool _GenerateSmallPreview()
    {
        return true; // also generate the small preview shown in lists
    }
}
#endif

// Register both from your main EditorPlugin (Plugin.cs):
//
// #if TOOLS
// public override void _EnterTree()
// {
//     _previewGen = new ItemPreviewGenerator();
//     EditorInterface.Singleton.GetResourcePreviewer().AddPreviewGenerator(_previewGen);
// }
//
// public override void _ExitTree()
// {
//     EditorInterface.Singleton.GetResourcePreviewer().RemovePreviewGenerator(_previewGen);
// }
// #endif
```

---

