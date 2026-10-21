# Notification Stack

Reference for `skills/hud-system/SKILL.md` — VBoxContainer-based notification stack with auto-dismiss, GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 5. Notification System

Toast-style notifications appear for a short time then auto-dismiss. A `VBoxContainer` holds all visible toasts; a max-visible cap drops the oldest when the queue overflows.

### GDScript

```gdscript
## notification_stack.gd — attach to a VBoxContainer anchored to top-right corner
class_name NotificationStack
extends VBoxContainer

@export var notification_scene: PackedScene
@export var max_visible: int = 5
@export var auto_dismiss_time: float = 3.0

var _queue: Array[String] = []
var _active: Array[Control] = []


func _ready() -> void:
    # Connect to an EventBus signal, or call push() directly from code.
    EventBus.notification_requested.connect(push)


## Enqueue a new notification message.
func push(message: String) -> void:
    _queue.append(message)
    _flush_queue()


func _flush_queue() -> void:
    while _queue.size() > 0 and _active.size() < max_visible:
        _show_next()


func _show_next() -> void:
    var message: String = _queue.pop_front()
    var toast: Control = notification_scene.instantiate()

    # Expect the toast scene to have a child Label named "MessageLabel"
    toast.get_node("MessageLabel").text = message
    toast.modulate.a = 0.0
    add_child(toast)
    _active.append(toast)

    # Fade in
    var tween: Tween = create_tween()
    tween.tween_property(toast, "modulate:a", 1.0, 0.2)

    # Auto-dismiss timer
    var timer: Timer = Timer.new()
    timer.wait_time = auto_dismiss_time
    timer.one_shot  = true
    toast.add_child(timer)
    timer.timeout.connect(_dismiss.bind(toast))
    timer.start()


func _dismiss(toast: Control) -> void:
    _active.erase(toast)

    var tween: Tween = toast.create_tween()
    tween.tween_property(toast, "modulate:a", 0.0, 0.2)
    tween.finished.connect(func() -> void:
        toast.queue_free()
        _flush_queue()  # Show next queued message if any
    )
```

### C#

```csharp
// NotificationStack.cs — attach to a VBoxContainer
using Godot;
using System.Collections.Generic;

public partial class NotificationStack : VBoxContainer
{
    [Export] public PackedScene NotificationScene { get; set; }
    [Export] public int MaxVisible { get; set; } = 5;
    [Export] public float AutoDismissTime { get; set; } = 3.0f;

    private readonly Queue<string> _queue  = new();
    private readonly List<Control> _active = new();

    public override void _Ready()
    {
        EventBus.Instance.NotificationRequested += Push;
    }

    public void Push(string message)
    {
        _queue.Enqueue(message);
        FlushQueue();
    }

    private void FlushQueue()
    {
        while (_queue.Count > 0 && _active.Count < MaxVisible)
            ShowNext();
    }

    private void ShowNext()
    {
        string message = _queue.Dequeue();
        var toast = NotificationScene.Instantiate<Control>();
        toast.GetNode<Label>("MessageLabel").Text = message;
        toast.Modulate = new Color(1, 1, 1, 0);
        AddChild(toast);
        _active.Add(toast);

        var tween = CreateTween();
        tween.TweenProperty(toast, "modulate:a", 1.0f, 0.2f);

        var timer = new Timer { WaitTime = AutoDismissTime, OneShot = true };
        toast.AddChild(timer);
        timer.Timeout += () => Dismiss(toast);
        timer.Start();
    }

    private void Dismiss(Control toast)
    {
        _active.Remove(toast);

        var tween = toast.CreateTween();
        tween.TweenProperty(toast, "modulate:a", 0.0f, 0.2f);
        tween.Finished += () =>
        {
            toast.QueueFree();
            FlushQueue();
        };
    }
}
```

**Toast scene structure:**

```
ToastNotification (PanelContainer)
└── MarginContainer
    └── MessageLabel (Label)
```

**EventBus signal needed:**

```gdscript
# autoloads/event_bus.gd
signal notification_requested(message: String)
```

```csharp
// EventBus.cs (partial — notification signal)
[Signal] public delegate void NotificationRequestedEventHandler(string message);
```

---

