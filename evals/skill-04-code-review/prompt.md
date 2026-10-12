---
tags: [ceiling]
max_turns: 12
timeout_seconds: 300
allowed_tools: [Skill, Read, Glob, Grep]
runs: 3
---
Review this GDScript for common Godot 4 issues.

```gdscript
extends CharacterBody2D

signal died

@export var fire_cooldown: float = 0.3

var _can_fire: bool = true


func _process(_delta: float) -> void:
    $HitArea.body_entered.connect(_on_hit_area_body_entered)

    if Input.is_key_pressed(KEY_SPACE) and _can_fire:
        _fire()


func _fire() -> void:
    _can_fire = false
    var bullet: Node2D = load("res://bullets/bullet.tscn").instantiate()
    get_parent().add_child(bullet)
    bullet.global_position = global_position
    await get_tree().create_timer(fire_cooldown).timeout
    _can_fire = true


func _on_hit_area_body_entered(body: Node2D) -> void:
    if body.is_in_group("enemy_bullet"):
        body.free()
        die()


func die() -> void:
    died.emit()
    queue_free()
    await get_tree().create_timer(1.0).timeout
    get_tree().change_scene_to_file("res://ui/game_over.tscn")
```
