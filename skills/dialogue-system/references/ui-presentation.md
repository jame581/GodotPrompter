# Dialogue UI

Reference for `skills/dialogue-system/SKILL.md` — scene tree (CanvasLayer + RichTextLabel + choices VBoxContainer), typewriter text, choice button spawning, signal wiring. GDScript + C#.

> ← Back to [SKILL.md](../SKILL.md)

---
## 6. Dialogue UI

### Scene Structure

```
DialogueUI (Control)
  ├─ PanelContainer
  │    ├─ HBoxContainer
  │    │    ├─ TextureRect      (portrait)
  │    │    └─ VBoxContainer
  │    │         ├─ Label       (speaker_name)
  │    │         └─ RichTextLabel (dialogue_text)
  │    └─ VBoxContainer         (choice_container)
  │         └─ Button × N       (instantiated at runtime)
  └─ Timer                      (typewriter_timer)
```

### GDScript

```gdscript
# dialogue_ui.gd
class_name DialogueUI
extends Control

@export var manager: DialogueManager  # assign the autoload or a node ref

@onready var speaker_label:    Label          = $PanelContainer/HBoxContainer/VBoxContainer/Label
@onready var dialogue_text:    RichTextLabel  = $PanelContainer/HBoxContainer/VBoxContainer/RichTextLabel
@onready var portrait:         TextureRect    = $PanelContainer/HBoxContainer/TextureRect
@onready var choice_container: VBoxContainer  = $PanelContainer/VBoxContainer
@onready var typewriter_timer: Timer          = $Timer

const TYPEWRITER_INTERVAL := 0.04  # seconds per character


func _ready() -> void:
    if manager == null:
        manager = get_node("/root/DialogueManager")
    manager.line_displayed.connect(_on_line_displayed)
    manager.choice_presented.connect(_on_choice_presented)
    manager.dialogue_ended.connect(_on_dialogue_ended)
    hide()


# ── Input ─────────────────────────────────────────────────────────────────────

func _unhandled_input(event: InputEvent) -> void:
    if not visible:
        return
    if event.is_action_pressed("ui_accept"):
        if typewriter_timer.is_stopped():
            manager.advance()
        else:
            # Skip typewriter — reveal full text immediately
            typewriter_timer.stop()
            dialogue_text.visible_characters = -1


# ── Signal handlers ───────────────────────────────────────────────────────────

func _on_line_displayed(line: DialogueLine) -> void:
    show()
    _clear_choices()

    speaker_label.text = line.speaker
    # Variable interpolation happens before display (see section 8)
    dialogue_text.text = _interpolate(line.text)
    dialogue_text.visible_characters = 0

    # Optionally set portrait from a Dictionary keyed by speaker name
    # portrait.texture = PortraitRegistry.get_portrait(line.speaker)

    typewriter_timer.wait_time = TYPEWRITER_INTERVAL
    typewriter_timer.start()


func _on_typewriter_tick() -> void:
    if dialogue_text.visible_characters < dialogue_text.get_total_character_count():
        dialogue_text.visible_characters += 1
    else:
        typewriter_timer.stop()


func _on_choice_presented(choices: Array) -> void:
    _clear_choices()
    for i in choices.size():
        var choice: Dictionary = choices[i]
        var btn := Button.new()
        btn.text = choice.get("text", "")
        btn.pressed.connect(manager.choose.bind(i))
        choice_container.add_child(btn)


func _on_dialogue_ended() -> void:
    hide()
    _clear_choices()


# ── Helpers ───────────────────────────────────────────────────────────────────

func _clear_choices() -> void:
    for child in choice_container.get_children():
        child.queue_free()


# Variable interpolation — see section 8.
func _interpolate(text: String) -> String:
    return text.format({
        "player_name": GameState.get("player_name") if GameState.get("player_name") else "Hero",
    })
```

```csharp
// DialogueUI.cs
using Godot;
using Godot.Collections;

public partial class DialogueUI : Control
{
    [Export] public DialogueManager Manager { get; set; }  // assign the autoload or a node ref

    private Label         _speakerLabel;
    private RichTextLabel _dialogueText;
    private TextureRect   _portrait;
    private VBoxContainer _choiceContainer;
    private Timer         _typewriterTimer;

    private const float TypewriterInterval = 0.04f;  // seconds per character

    public override void _Ready()
    {
        _speakerLabel    = GetNode<Label>("PanelContainer/HBoxContainer/VBoxContainer/Label");
        _dialogueText    = GetNode<RichTextLabel>("PanelContainer/HBoxContainer/VBoxContainer/RichTextLabel");
        _portrait        = GetNode<TextureRect>("PanelContainer/HBoxContainer/TextureRect");
        _choiceContainer = GetNode<VBoxContainer>("PanelContainer/VBoxContainer");
        _typewriterTimer = GetNode<Timer>("Timer");

        Manager ??= GetNode<DialogueManager>("/root/DialogueManager");

        Manager.LineDisplayed += OnLineDisplayed;
        Manager.ChoicePresented += OnChoicePresented;
        Manager.DialogueEnded += OnDialogueEnded;

        _typewriterTimer.Timeout += OnTypewriterTick;

        Hide();
    }

    // ── Input ──────────────────────────────────────────────────────────────────

    public override void _UnhandledInput(InputEvent @event)
    {
        if (!Visible) return;
        if (@event.IsActionPressed("ui_accept"))
        {
            if (_typewriterTimer.IsStopped())
                Manager.Advance();
            else
            {
                // Skip typewriter — reveal full text immediately
                _typewriterTimer.Stop();
                _dialogueText.VisibleCharacters = -1;
            }
        }
    }

    // ── Signal handlers ────────────────────────────────────────────────────────

    private void OnLineDisplayed(DialogueLine line)
    {
        Show();
        ClearChoices();

        _speakerLabel.Text = line.Speaker;
        // Variable interpolation happens before display (see section 8)
        _dialogueText.Text = Interpolate(line.Text);
        _dialogueText.VisibleCharacters = 0;

        // Optionally set portrait from a Dictionary keyed by speaker name:
        // _portrait.Texture = PortraitRegistry.GetPortrait(line.Speaker);

        _typewriterTimer.WaitTime = TypewriterInterval;
        _typewriterTimer.Start();
    }

    private void OnTypewriterTick()
    {
        if (_dialogueText.VisibleCharacters < _dialogueText.GetTotalCharacterCount())
            _dialogueText.VisibleCharacters += 1;
        else
            _typewriterTimer.Stop();
    }

    private void OnChoicePresented(Array<Dictionary> choices)
    {
        ClearChoices();
        for (int i = 0; i < choices.Count; i++)
        {
            var choice = choices[i];
            var btn = new Button();
            btn.Text = choice.TryGetValue("text", out var t) ? t.AsString() : "";
            int captured = i;
            btn.Pressed += () => Manager.Choose(captured);
            _choiceContainer.AddChild(btn);
        }
    }

    private void OnDialogueEnded()
    {
        Hide();
        ClearChoices();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private void ClearChoices()
    {
        foreach (var child in _choiceContainer.GetChildren())
            child.QueueFree();
    }

    // Variable interpolation — see section 8.
    private string Interpolate(string text)
    {
        var gs = GetNode<GameState>("/root/GameState");
        var playerName = gs.Get("player_name").AsString();
        if (string.IsNullOrEmpty(playerName)) playerName = "Hero";
        return text.Replace("{player_name}", playerName);
    }
}
```

Connect the `Timer`'s `timeout` signal to `_on_typewriter_tick` in the editor or in `_ready()`:

```gdscript
typewriter_timer.timeout.connect(_on_typewriter_tick)
```

---

