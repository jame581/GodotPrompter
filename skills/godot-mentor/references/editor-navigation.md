# Editor Navigation — where things are (Godot 4.3 to 4.7)

Reference for `skills/godot-mentor/SKILL.md` — the editor's main screens, docks, bottom panels,
and Project Settings tabs, with the versions each location applies to.

> ← Back to [SKILL.md](../SKILL.md)

Unflagged entries are the same in every version from 4.3 to 4.7. Verified against the
godot-docs branches and the engine source for each version; see
`docs/superpowers/notes/2026-10-05-godot-editor-research.md` in the GodotPrompter repository.

---

How to read the tables:

- An empty Versions cell means the row is the same on every version from 4.3 to 4.7. A flagged
  row uses a range: 4.3-4.5 means 4.3, 4.4 and 4.5; 4.6+ means 4.6 and 4.7.
- A cell holding only "—" means the research did not establish that fact. Say so to the learner
  rather than filling it in. In a row marked as not existing on that version, "—" means not
  applicable.
- **Bold** text is text the editor displays. A tooltip is always introduced as a tooltip, because
  the learner sees it only on hover. Where the Godot docs use a different word for the same
  thing, the docs' word is given in quotes.

## Main screens

The top edge of the editor window holds the main menu on the left, the workspace switching
buttons (the main screen buttons) in the centre with the active one highlighted, and the
playtest buttons on the right. Below the main screen buttons, the opened scenes appear as tabs;
the plus (+) button next to the tabs adds a new scene, and the button on the far right toggles
distraction-free mode.

| Area | What it is for | Default location | Versions |
|---|---|---|---|
| **2D** | — | Top centre, first main screen button | |
| **3D** | — | Top centre, second main screen button | |
| **Script** | Where a script opens after you create it or connect a signal to it; a "Search Help" button sits in its top-right | Top centre, third main screen button | |
| **Game** | Does not exist | — | 4.3 |
| **Game** | Where your project appears when you run it from the editor. Changes made here are not saved when the game stops running | Top centre, fourth main screen button | 4.4+ |
| **AssetLib** (the docs call it "Asset Library") | The Asset Library inside the editor; add-ons are downloaded there with the **Download** button | Top centre, last main screen button | 4.3-4.6 |
| **Asset Store** (the 4.7 docs still call it "Asset Library" and "AssetLib") | Same purpose as **AssetLib** | Top centre, last main screen button | 4.7 |

Adding a 2D node type such as Label as a scene's first node changes the scene to the **2D**
workspace.

The playtest buttons in the top-right include **Run Project** (F5; Cmd + B on macOS) and
**Run Current Scene** (F6; Cmd + R on macOS). Stop a running scene by closing its window or
pressing F8 (Cmd + . on macOS).

## Docks

The docks sit on either side of the viewport. The locations below are the defaults; they change
once a learner has moved a dock.

- **Reopen a closed dock:** open the **Editor** menu, then the **Editor Docks** submenu, and
  choose the dock's name. The dock opens where it last was and comes to the front. A closed
  dock's icon in that submenu is drawn half-transparent.
- **Close or move a dock:** click the "3 vertical dots" icon at the top of the dock. The popup
  that appears has a **Dock Position** label, **Make Floating** (which splits the dock into a
  separate window) and **Close**.
- **Resize:** click and drag the edge of any dock or panel.

| Area | What it is for | Default location | Reopen it if closed | Versions |
|---|---|---|---|---|
| **Scene** | Shows the scene's nodes: a node you add appears here. The button the docs call "Add Child Node" is at its top-left; its tooltip reads **Add/Create a New Node.** While a game runs from the editor, **Remote** and **Local** options appear at its top | Left side, upper slot, first tab | **Editor > Editor Docks > Scene** | |
| **Import** | Shows the import parameters of the resource selected in the **FileSystem** dock; click **Reimport** after changing them | Left side, upper slot, second tab (after **Scene**) | **Editor > Editor Docks > Import** | |
| **FileSystem** | Shows your project folders and files. Double-click a scene file to open it; drag files onto it from the operating system's file manager to add them | Left side, lower slot (the lower left corner), first tab | **Editor > Editor Docks > FileSystem** | |
| **Inspector** | Shows the selected node's properties | Right side, first tab | **Editor > Editor Docks > Inspector** | |
| **Node** | Holds two buttons, **Signals** and **Groups**. With nothing selected it reads "Select a single node to edit its signals and groups." | Right side, second tab (next to **Inspector**) | **Editor > Editor Docks > Node** | 4.3-4.5 |
| **Node** | Does not exist; use the **Signals** and **Groups** docks | — | — | 4.6+ |
| **Signals** | Lists the signals available on the selected node; double-click one to open the connection window | Not a dock: the **Signals** button inside the **Node** dock | Reopen the **Node** dock | 4.3-4.5 |
| **Signals** | Same as above | Right side, second tab (next to **Inspector**) | **Editor > Editor Docks > Signals** | 4.6+ |
| **Groups** | Where you create groups and tick the groups the selected node belongs to | Not a dock: the **Groups** button inside the **Node** dock | Reopen the **Node** dock | 4.3-4.5 |
| **Groups** | Same as above | Right side, third tab (after **Signals**) | **Editor > Editor Docks > Groups** | 4.6+ |
| **History** | — | Right side, third tab (after **Inspector** and **Node**) | **Editor > Editor Docks > History** | 4.3-4.5 |
| **History** | — | Left side, lower slot, second tab (after **FileSystem**) | **Editor > Editor Docks > History** | 4.6+ |

## Bottom panels

The bottom panel lies at the bottom of the window. Its panels are folded by default; opening one
expands it vertically.

- **Open a panel on 4.3-4.5:** each panel has a button at the bottom of the editor carrying the
  panel's name. Click it to show that panel; click it again to fold the bottom panel.
- **Open a panel on 4.6+:** each panel is a tab at the bottom of the editor carrying the panel's
  name. Click the tab to show that panel; click the current tab again to fold it.
- **On 4.6+ only**, **Output**, **Audio**, **Animation** and **Shader Editor** are also listed
  under **Editor > Editor Docks**, and on 4.7 so is **Debugger**.
- **Shortcuts:** bottom panels can be shown or hidden with the shortcuts defined in
  **Editor Settings > Shortcuts**, under the **Bottom Panels** category
  (**Editor > Editor Settings...** opens the Editor Settings).

Some panels exist only in context: their button or tab is absent until the editor is editing
something that panel works on, and goes away again afterwards. A learner who cannot find one
of these has not lost it; they need to select the right node or resource first. The table says
"context only" for these. The left-to-right order of the buttons or tabs was not established.

| Area | What it is for | Reopen it if closed | Versions |
|---|---|---|---|
| **Output** | Shows text printed by the running project (the docs from 4.4 add: and by the editor) | Click the **Output** button (4.3-4.5) or tab (4.6+) at the bottom of the editor; on 4.6+ also **Editor > Editor Docks > Output** | |
| **Debugger** | Holds the tabs **Stack Trace**, **Errors**, **Profiler**, **Visual Profiler**, **Video RAM** and **Misc** (the docs also describe "Network Profiler" and "Monitors" tabs) | Click the **Debugger** button at the bottom of the editor | 4.3 |
| **Debugger** | Same tabs as above, plus **Evaluator** | Click the **Debugger** button (4.4-4.5) or tab (4.6+) at the bottom of the editor; on 4.7 also **Editor > Editor Docks > Debugger** | 4.4+ |
| **Audio** | — | Click the **Audio** button (4.3-4.5) or tab (4.6+) at the bottom of the editor; on 4.6+ also **Editor > Editor Docks > Audio** | |
| **Animation** | The animation editor for an AnimationPlayer node | Click the **Animation** button (4.3-4.5) or tab (4.6+) at the bottom of the editor; on 4.6+ also **Editor > Editor Docks > Animation**; clicking an AnimationPlayer node also opens it | |
| **AnimationTree** | — | Context only; what brings it up was not researched | |
| **Shader Editor** | — | — | 4.3-4.5 |
| **Shader Editor** | — | **Editor > Editor Docks > Shader Editor** | 4.6+ |
| **ShaderFile** | — | Context only; what brings it up was not researched | |
| **SpriteFrames** | Where the animations and frames of a SpriteFrames resource are edited | Context only: click the SpriteFrames resource and the panel appears at the bottom of the editor window | |
| **Theme** | The theme editor | Context only: it activates automatically when a Theme resource is selected for editing | |
| **TileSet** | Where a tilesheet image is dragged in to create the tiles of a TileSet | Context only: with the TileSet resource being edited, click **TileSet** at the bottom of the editor | |
| **TileMap** | Where tiles are picked for painting onto a TileMapLayer node | Context only: select the TileMapLayer node, then click **TileMap** at the bottom of the editor | |
| **ResourcePreloader** | — | Context only; what brings it up was not researched | |
| **Search Results** | — | It appears when a find-in-files search is started, and its close button removes it again | |
| **Version Control** | — | — | |
| **Polygon** | Does not exist | — | 4.3 |
| **Polygon** | — | Context only; what brings it up was not researched | 4.4+ |
| **MeshLibrary** | Does not exist | — | 4.3-4.6 |
| **MeshLibrary** | — | — | 4.7 |
| **Replication** | — | Context only: select a MultiplayerSynchronizer node and the panel appears at the bottom of the editor | |
| **GridMap** | Does not exist as a bottom panel | — | 4.3 |
| **GridMap** | — | Context only: select a GridMap node and the panel appears at the bottom of the editor | 4.4+ |
| **MSBuild** | — | Only in .NET builds of the editor, and only once the project has a C# project file; then click **MSBuild** at the bottom of the editor | |

## Project Settings tabs

Open the window with **Project > Project Settings...**; it is titled
**Project Settings (project.godot)**. In this table "Reopen it if closed" is the path back to
the tab.

| Area | What it is for | Default location | Reopen it if closed | Versions |
|---|---|---|---|---|
| **General** | The project's settings, grouped in a left column (for example **Display > Window**). Has a **Filter Settings** search field and an **Advanced Settings** toggle | First tab | **Project > Project Settings...** | |
| **Input Map** (some docs pages write "InputMap") | Where input actions are created and assigned input events | Second tab | **Project > Project Settings... > Input Map** | |
| **Localization** | Translations for the project; holds three sub-tabs | Third tab | **Project > Project Settings... > Localization** | |
| **Localization > Translations** | Add or remove translations project-wide, with the **Add...** button | First sub-tab of **Localization** | **Project > Project Settings... > Localization > Translations** | |
| **Localization > Remaps** | Select a resource to be remapped, then add alternatives for each locale | Second sub-tab of **Localization** | **Project > Project Settings... > Localization > Remaps** | |
| **Localization > POT Generation** | — | Third sub-tab of **Localization** | **Project > Project Settings... > Localization > POT Generation** | 4.3-4.5 |
| **Localization > Template Generation** | — | Third sub-tab of **Localization** | **Project > Project Settings... > Localization > Template Generation** | 4.6+ |
| **Globals** | Holds three sub-tabs: **Autoload**, **Shader Globals**, **Groups** | Fourth tab | **Project > Project Settings... > Globals** | |
| **Globals > Autoload** | Where a scene or script is set to autoload | First sub-tab of **Globals** | **Project > Project Settings... > Globals > Autoload** | |
| **Globals > Shader Globals** | — | Second sub-tab of **Globals** | **Project > Project Settings... > Globals > Shader Globals** | |
| **Globals > Groups** | Where global groups are managed | Third sub-tab of **Globals** | **Project > Project Settings... > Globals > Groups** | |
| **Plugins** | Lists installed editor plugins under the heading **Installed Plugins:**; tick the checkbox in the **Enabled** column (the docs call it the "Enable" checkbox) to enable one | Fifth tab | **Project > Project Settings... > Plugins** | |
| **GDExtension** | Does not exist | — | — | 4.3-4.6 |
| **GDExtension** | — | Sixth tab, between **Plugins** and **Import Defaults** | **Project > Project Settings... > GDExtension** | 4.7 |
| **Import Defaults** | Project-wide default import settings | Sixth tab, the last one | **Project > Project Settings... > Import Defaults** | 4.3-4.6 |
| **Import Defaults** | Same as above | Seventh tab, the last one | **Project > Project Settings... > Import Defaults** | 4.7 |

## Top menus

The main menu is on the left of the editor's top edge. Its menus, left to right, are **Scene**,
**Project**, **Debug**, **Editor**, **Help**. The items listed are the ones the research
recorded, not each menu's full contents, and except for **Debug** their order within the menu
was not recorded.

| Area | What it is for | Default location | Versions |
|---|---|---|---|
| **Scene** | **New Scene**, **Save Scene**, **Save Scene As...**, **Open Scene...**, **New Inherited Scene...** | Top-left, first menu | |
| **Project** | **Project Settings...**, **Export...**, **Install Android Build Template...**, **Open User Data Folder**, a **Tools** submenu, and **Quit to Project List** (Ctrl + Shift + Q; Ctrl + Option + Cmd + Q on macOS), which opens the Project Manager | Top-left, second menu | 4.3 |
| **Project** | Same items as above, plus **Pack Project as ZIP...** | Top-left, second menu | 4.4+ |
| **Debug** | In order: **Deploy with Remote Debug**, **Small Deploy with Network Filesystem**, **Visible Collision Shapes**, **Visible Paths**, **Visible Navigation**, **Visible Avoidance**, **Debug CanvasItem Redraws**, **Synchronize Scene Changes**, **Synchronize Script Changes**, **Keep Debug Server Open**, **Customize Run Instances...** | Top-left, third menu | |
| **Editor** | **Editor Settings...** (on macOS with the global menu it is in the application menu instead), **Manage Export Templates...**, the **Editor Docks** submenu (reopens docks; see Docks), and the **Editor Layout** submenu with **Save Layout...**, **Delete Layout...** and **Default** (the docs call the submenu "Editor Layouts" and its items "Save" and "Delete") | Top-left, fourth menu | |
| **Help** | **Search Help...** opens the built-in help. So does pressing F1 anywhere in the editor (Opt + Space on macOS; Fn + F1 on laptops with an Fn key) | Top-left, fifth menu | |

**Default** in the **Editor Layout** submenu is a hardcoded editor layout that cannot be removed.

## Version notes

What moved, appeared or was renamed, and in which version. The tables give the location on each
version; these notes give the change, and say where the Godot docs lag the editor.

**Main screens and Project Manager**

- 4.4 added the **Game** main screen, between **Script** and the asset library button. 4.3 has
  four main screen buttons, 4.4+ has five.
- 4.7 renamed the **AssetLib** button to **Asset Store**, and the Project Manager's second tab
  from **Asset Library** to **Asset Store**. The 4.7 docs still say "AssetLib" and
  "Asset Library", so a learner on 4.7 following the docs will not find a button with that name.
- The 4.7 docs add a page on game embedding. The embedding controls were not researched; do not
  describe them.
- The docs gained sentences on their 4.4 branch about a Movie Maker Mode toggle in the top-right
  and about the "Project" menu being in the upper left corner. Whether anything changed in the
  editor at 4.4 was not checked.

**Docks**

- 4.6 split the **Node** dock in two. A learner on 4.3-4.5 clicks the **Node** tab and then
  finds **Signals** and **Groups** inside it; a learner on 4.6+ has no **Node** tab and clicks
  **Signals** or **Groups** directly, in the same right-side slot.
- 4.6 moved the **History** dock from the right side to the left lower slot, beside
  **FileSystem**.
- **Editor > Editor Docks** reopens a closed dock on every version, but its contents changed. On
  4.3 it lists every dock and greys out a disabled one. From 4.4 a disabled dock is left out and
  each item has a tooltip, reading **Open the Scene dock.** for a closed dock and
  **Focus on the Scene dock.** for an open one (with that dock's name). From 4.6 it also lists
  some bottom panels (see Bottom panels).
- The popup behind a dock's "3 vertical dots" icon has a **Move to Bottom** button on 4.3-4.5
  only. On 4.6+ its **Close** button can be disabled, with a tooltip reading
  **This dock can't be closed.**

**Bottom panels**

- 4.6 turned the bottom panel's named buttons into named tabs; from 4.6 each bottom panel is a
  dock whose default slot is the bottom. 4.7 defines two bottom slots; how that looks by default
  was not established.
- 4.4 added **Polygon** and made **GridMap** a bottom panel; 4.7 added **MeshLibrary**.

**Project Settings**

- 4.7 added the **GDExtension** tab, which pushes **Import Defaults** from sixth to seventh.
- 4.6 renamed the third **Localization** sub-tab from **POT Generation** to
  **Template Generation**.
- **Localization > Translations** has not moved. Only the docs changed: they wrote
  "Project Settings > Localization" until 4.5 and name the **Translations** sub-tab from 4.6.
- **Globals > Autoload** has not moved either; the docs and the editor agree on every version.
