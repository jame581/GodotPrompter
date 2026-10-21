# Service Locator Pattern

Reference for `skills/dependency-injection/SKILL.md` — central registry autoload for runtime service lookup. GDScript + C# implementation with typed helpers.

> ← Back to [SKILL.md](../SKILL.md)

---
## 5. Service Locator Pattern

A Service Locator is an autoload that acts as a runtime registry. Systems register themselves by name; consumers retrieve them by name. Unlike direct autoload access, the locator is the *only* hard dependency — everything else is swappable.

Useful for:
- Plugin architectures where systems opt in at runtime
- Swapping real implementations for stubs in tests
- Optional systems (e.g., analytics) that may or may not be present

### GDScript (`autoloads/service_locator.gd`)

```gdscript
extends Node

var _services: Dictionary = {}


## Registers a service under [param service_name].
## Call from the service's own _ready().
func register(service_name: String, instance: Object) -> void:
    if _services.has(service_name):
        push_warning("ServiceLocator: overwriting existing service '%s'" % service_name)
    _services[service_name] = instance


## Removes a service registration. Call from _exit_tree() of the service.
func unregister(service_name: String) -> void:
    _services.erase(service_name)


## Returns the service registered under [param service_name], or null.
## Cast the result to the expected type at the call site.
func get_service(service_name: String) -> Object:
    if not _services.has(service_name):
        push_warning("ServiceLocator: no service registered for '%s'" % service_name)
        return null
    return _services[service_name]


## Typed convenience helper — returns null and warns if the cast fails.
func get_typed(service_name: String, expected_type: Variant) -> Variant:
    var svc: Object = get_service(service_name)
    if svc == null:
        return null
    if not is_instance_of(svc, expected_type):
        push_warning(
            "ServiceLocator: '%s' is not an instance of %s" % [service_name, expected_type]
        )
        return null
    return svc
```

```gdscript
# audio_service.gd — self-registers on ready
extends Node
class_name AudioService

func _ready() -> void:
    ServiceLocator.register("audio", self)

func _exit_tree() -> void:
    ServiceLocator.unregister("audio")

func play_sfx(key: String) -> void:
    pass  # implementation


# consumer.gd — retrieves the service at runtime
func _ready() -> void:
    var audio := ServiceLocator.get_typed("audio", AudioService) as AudioService
    if audio != null:
        audio.play_sfx("pickup")
```

### C# (`Autoloads/ServiceLocator.cs`)

```csharp
using Godot;
using System.Collections.Generic;

/// <summary>
/// Runtime service registry. Register as autoload named "ServiceLocator".
/// </summary>
public partial class ServiceLocator : Node
{
    private readonly Dictionary<string, GodotObject> _services = new();

    /// <summary>Registers a service under <paramref name="serviceName"/>.</summary>
    public void Register(string serviceName, GodotObject instance)
    {
        if (_services.ContainsKey(serviceName))
            GD.PushWarning($"ServiceLocator: overwriting existing service '{serviceName}'");
        _services[serviceName] = instance;
    }

    /// <summary>Removes a service registration.</summary>
    public void Unregister(string serviceName) => _services.Remove(serviceName);

    /// <summary>Returns the service or null, with a warning if missing.</summary>
    public GodotObject GetService(string serviceName)
    {
        if (!_services.TryGetValue(serviceName, out var service))
        {
            GD.PushWarning($"ServiceLocator: no service registered for '{serviceName}'");
            return null;
        }
        return service;
    }

    /// <summary>Typed retrieval — returns null and warns on type mismatch.</summary>
    public T GetService<T>(string serviceName) where T : GodotObject
    {
        var service = GetService(serviceName);
        if (service is T typed)
            return typed;
        if (service != null)
            GD.PushWarning($"ServiceLocator: '{serviceName}' is not of type {typeof(T).Name}");
        return null;
    }
}
```

```csharp
using Godot;

// AudioService.cs — self-registers
public partial class AudioService : Node
{
    public override void _Ready()
    {
        GetNode<ServiceLocator>("/root/ServiceLocator").Register("audio", this);
    }

    public override void _ExitTree()
    {
        GetNode<ServiceLocator>("/root/ServiceLocator").Unregister("audio");
    }

    public void PlaySfx(string key) { /* implementation */ }
}

// Consumer.cs — typed retrieval
public partial class Pickup : Area2D
{
    public override void _Ready()
    {
        var audio = GetNode<ServiceLocator>("/root/ServiceLocator")
            .GetService<AudioService>("audio");
        audio?.PlaySfx("pickup");
    }
}
```

---

