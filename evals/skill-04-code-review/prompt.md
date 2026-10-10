---
max_turns: 12
timeout_seconds: 300
allowed_tools: [Skill, Read, Glob, Grep]
runs: 3
---
Review this GDScript for common Godot 4 issues.

```gdscript
extends CharacterBody2D

var health = 100
var speed = 200

func _process(delta):
    var player = get_node("/root/Main/Player")
    if player:
        var dir = (player.position - position).normalized()
        position += dir * speed * delta

func take_damage(amount):
    health -= amount
    if health <= 0:
        get_parent().remove_child(self)
        queue_free()
```
