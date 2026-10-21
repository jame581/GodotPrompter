# Match Flow State Machine

Reference for `skills/dedicated-server/SKILL.md` — state machine for lobby → countdown → in-game → results, with GDScript and C# implementations.

> ← Back to [SKILL.md](../SKILL.md)

---
## 4. Match Flow

### State Enum and Transitions

```
Lobby → Countdown → Gameplay → Results → Lobby
```

### GDScript

```gdscript
# match_manager.gd — autoload named MatchManager, runs on server only
extends Node

enum MatchState {
    LOBBY,
    COUNTDOWN,
    GAMEPLAY,
    RESULTS,
}

var current_state: MatchState = MatchState.LOBBY

## Countdown duration in seconds.
const COUNTDOWN_DURATION := 5.0
## Results screen duration in seconds.
const RESULTS_DURATION := 10.0

var _countdown_timer: float = 0.0
var _results_timer: float = 0.0


func _ready() -> void:
    if not multiplayer.is_server():
        set_physics_process(false)
        return
    # LobbyManager emits this when all players are ready.
    LobbyManager.all_players_ready.connect(_on_all_players_ready)


func _physics_process(delta: float) -> void:
    match current_state:
        MatchState.COUNTDOWN:
            _countdown_timer -= delta
            if _countdown_timer <= 0.0:
                _transition_to(MatchState.GAMEPLAY)
        MatchState.RESULTS:
            _results_timer -= delta
            if _results_timer <= 0.0:
                _transition_to(MatchState.LOBBY)


func _on_all_players_ready() -> void:
    _transition_to(MatchState.COUNTDOWN)


func _transition_to(new_state: MatchState) -> void:
    current_state = new_state
    print("[Match] Transitioning to %s" % MatchState.keys()[new_state])

    match new_state:
        MatchState.LOBBY:
            _reset_lobby()
            _notify_state_changed.rpc(new_state)

        MatchState.COUNTDOWN:
            _countdown_timer = COUNTDOWN_DURATION
            _notify_state_changed.rpc(new_state)
            _notify_countdown.rpc(COUNTDOWN_DURATION)

        MatchState.GAMEPLAY:
            _notify_state_changed.rpc(new_state)
            get_tree().change_scene_to_file("res://scenes/game.tscn")

        MatchState.RESULTS:
            _results_timer = RESULTS_DURATION
            _notify_state_changed.rpc(new_state)


## Call this from gameplay code when win/loss conditions are met.
func end_match() -> void:
    if current_state != MatchState.GAMEPLAY:
        return
    _transition_to(MatchState.RESULTS)


func _reset_lobby() -> void:
    # Reset ready states so players must re-confirm for the next match.
    for peer_id in LobbyManager.player_list:
        LobbyManager.player_list[peer_id]["ready"] = false


# ── RPCs ──────────────────────────────────────────────────────────────────────

@rpc("authority", "reliable", "call_local")
func _notify_state_changed(new_state: MatchState) -> void:
    print("[Match] State → %s" % MatchState.keys()[new_state])
    # Clients update their UI here.


@rpc("authority", "reliable", "call_local")
func _notify_countdown(seconds: float) -> void:
    print("[Match] Countdown: %.0f seconds" % seconds)
    # Clients start their countdown overlay here.
```

### C#

```csharp
// MatchManager.cs — autoload named MatchManager, runs on server only
using Godot;

public partial class MatchManager : Node
{
    public enum MatchState { Lobby, Countdown, Gameplay, Results }

    public MatchState CurrentState { get; private set; } = MatchState.Lobby;

    private const float CountdownDuration = 5.0f;
    private const float ResultsDuration   = 10.0f;

    private float _countdownTimer;
    private float _resultsTimer;

    public override void _Ready()
    {
        if (!Multiplayer.IsServer())
        {
            SetPhysicsProcess(false);
            return;
        }
        var lobby = GetNode<LobbyManager>("/root/LobbyManager");
        lobby.AllPlayersReady += OnAllPlayersReady;
    }

    public override void _PhysicsProcess(double delta)
    {
        switch (CurrentState)
        {
            case MatchState.Countdown:
                _countdownTimer -= (float)delta;
                if (_countdownTimer <= 0f)
                    TransitionTo(MatchState.Gameplay);
                break;

            case MatchState.Results:
                _resultsTimer -= (float)delta;
                if (_resultsTimer <= 0f)
                    TransitionTo(MatchState.Lobby);
                break;
        }
    }

    private void OnAllPlayersReady() => TransitionTo(MatchState.Countdown);

    private void TransitionTo(MatchState newState)
    {
        CurrentState = newState;
        GD.Print($"[Match] Transitioning to {newState}");

        switch (newState)
        {
            case MatchState.Lobby:
                ResetLobby();
                Rpc(MethodName.NotifyStateChanged, (int)newState);
                break;

            case MatchState.Countdown:
                _countdownTimer = CountdownDuration;
                Rpc(MethodName.NotifyStateChanged, (int)newState);
                Rpc(MethodName.NotifyCountdown, CountdownDuration);
                break;

            case MatchState.Gameplay:
                Rpc(MethodName.NotifyStateChanged, (int)newState);
                GetTree().ChangeSceneToFile("res://scenes/game.tscn");
                break;

            case MatchState.Results:
                _resultsTimer = ResultsDuration;
                Rpc(MethodName.NotifyStateChanged, (int)newState);
                break;
        }
    }

    public void EndMatch()
    {
        if (CurrentState != MatchState.Gameplay) return;
        TransitionTo(MatchState.Results);
    }

    private void ResetLobby()
    {
        var lobby = GetNode<LobbyManager>("/root/LobbyManager");
        foreach (var peerId in lobby.GetPlayerIds())
            lobby.SetPlayerReady(peerId, false);
    }

    [Rpc(MultiplayerApi.RpcMode.Authority, CallLocal = true,
         TransferMode = MultiplayerPeer.TransferModeEnum.Reliable)]
    private void NotifyStateChanged(int newState)
        => GD.Print($"[Match] State → {(MatchState)newState}");

    [Rpc(MultiplayerApi.RpcMode.Authority, CallLocal = true,
         TransferMode = MultiplayerPeer.TransferModeEnum.Reliable)]
    private void NotifyCountdown(float seconds)
        => GD.Print($"[Match] Countdown: {seconds:F0} seconds");
}
```

---

