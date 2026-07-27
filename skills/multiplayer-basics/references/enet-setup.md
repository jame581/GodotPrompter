> ← Back to [SKILL.md](../SKILL.md)

# Setting Up ENetMultiplayerPeer

## GDScript

```gdscript
# network_manager.gd — add as autoload named NetworkManager
extends Node

const DEFAULT_PORT := 7777
const MAX_CLIENTS  := 16

var peer: ENetMultiplayerPeer


func host_game(port: int = DEFAULT_PORT) -> void:
	peer = ENetMultiplayerPeer.new()
	var err := peer.create_server(port, MAX_CLIENTS)
	if err != OK:
		push_error("NetworkManager: create_server failed — error %d" % err)
		return
	multiplayer.multiplayer_peer = peer
	_connect_signals()
	print("NetworkManager: hosting on port %d" % port)


func join_game(address: String, port: int = DEFAULT_PORT) -> void:
	peer = ENetMultiplayerPeer.new()
	var err := peer.create_client(address, port)
	if err != OK:
		push_error("NetworkManager: create_client failed — error %d" % err)
		return
	multiplayer.multiplayer_peer = peer
	_connect_signals()
	print("NetworkManager: connecting to %s:%d" % [address, port])


func disconnect_from_game() -> void:
	if peer:
		peer.close()
	multiplayer.multiplayer_peer = null


func _connect_signals() -> void:
	multiplayer.peer_connected.connect(_on_peer_connected)
	multiplayer.peer_disconnected.connect(_on_peer_disconnected)
	multiplayer.connected_to_server.connect(_on_connected_to_server)
	multiplayer.connection_failed.connect(_on_connection_failed)


func _on_peer_connected(id: int) -> void:
	print("NetworkManager: peer connected — id %d" % id)


func _on_peer_disconnected(id: int) -> void:
	print("NetworkManager: peer disconnected — id %d" % id)


func _on_connected_to_server() -> void:
	print("NetworkManager: connected to server — my id is %d" % multiplayer.get_unique_id())


func _on_connection_failed() -> void:
	push_error("NetworkManager: connection failed")
```

**Key signal summary:**

| Signal | Fires on | When |
|--------|----------|------|
| `peer_connected` | Server + clients | A new peer finishes connecting |
| `peer_disconnected` | Server + clients | A peer disconnects or times out |
| `connected_to_server` | Client only | This client successfully connected |
| `connection_failed` | Client only | This client could not connect |

## C#

```csharp
// NetworkManager.cs — add as autoload named NetworkManager
using Godot;

public partial class NetworkManager : Node
{
    private const int DefaultPort  = 7777;
    private const int MaxClients   = 16;

    private ENetMultiplayerPeer _peer;

    public void HostGame(int port = DefaultPort)
    {
        _peer = new ENetMultiplayerPeer();
        var err = _peer.CreateServer(port, MaxClients);
        if (err != Error.Ok)
        {
            GD.PushError($"NetworkManager: CreateServer failed — error {err}");
            return;
        }
        Multiplayer.MultiplayerPeer = _peer;
        ConnectSignals();
        GD.Print($"NetworkManager: hosting on port {port}");
    }

    public void JoinGame(string address, int port = DefaultPort)
    {
        _peer = new ENetMultiplayerPeer();
        var err = _peer.CreateClient(address, port);
        if (err != Error.Ok)
        {
            GD.PushError($"NetworkManager: CreateClient failed — error {err}");
            return;
        }
        Multiplayer.MultiplayerPeer = _peer;
        ConnectSignals();
        GD.Print($"NetworkManager: connecting to {address}:{port}");
    }

    public void DisconnectFromGame()
    {
        _peer?.Close();
        Multiplayer.MultiplayerPeer = null;
    }

    private void ConnectSignals()
    {
        Multiplayer.PeerConnected      += OnPeerConnected;
        Multiplayer.PeerDisconnected   += OnPeerDisconnected;
        Multiplayer.ConnectedToServer  += OnConnectedToServer;
        Multiplayer.ConnectionFailed   += OnConnectionFailed;
    }

    private void OnPeerConnected(long id)
        => GD.Print($"NetworkManager: peer connected — id {id}");

    private void OnPeerDisconnected(long id)
        => GD.Print($"NetworkManager: peer disconnected — id {id}");

    private void OnConnectedToServer()
        => GD.Print($"NetworkManager: connected — my id is {Multiplayer.GetUniqueId()}");

    private void OnConnectionFailed()
        => GD.PushError("NetworkManager: connection failed");
}
```
