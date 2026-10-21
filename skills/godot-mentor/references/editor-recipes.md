# Editor Recipes — how to do it in the Godot editor (4.3 to 4.7)

Reference for `skills/godot-mentor/SKILL.md` — numbered click-paths for the editor workflows a
learner meets first.

> ← Back to [SKILL.md](../SKILL.md)

Steps with no version flag are the same in every version from 4.3 to 4.7. Where the editor
changed, the step lists each version range. Verified against the godot-docs branches and the
engine source for each version; see `docs/superpowers/notes/2026-10-05-godot-editor-research.md`
in the GodotPrompter repository. For where a dock or panel is, see
[editor-navigation.md](editor-navigation.md).

---

How to read these recipes: **bold** text is a label as the editor shows it, and a tooltip is
always introduced as a tooltip. Sentences about what the research did not record, and
instructions such as "do not name it", are notes for the agent, not steps: tell the learner
plainly that this part is not covered rather than reading the note out.

## Add a node and attach a script

**When:** the scene needs a new node, and that node needs its own script.

1. In the **Scene** dock, select the node that will be the parent, then click the button the
   docs call "Add Child Node" at the dock's top-left; its tooltip reads
   **Add/Create a New Node.** Right-clicking the parent and choosing **Add Child Node...** does
   the same. In an empty scene the dock offers root-node buttons instead: **2D Scene**,
   **3D Scene**, **User Interface** and **Other Node**.
2. The **Create New Node** dialog opens (the docs for Godot 4.3 and 4.4 call it "the Create Node
   dialog"; the title is the same on every version). Type the node type's name to filter the
   list, select the type, and click **Create** at the bottom of the window. Double-clicking the
   type also creates the node.
3. Right-click the new node in the **Scene** dock and choose **Attach Script...**.
4. The **Attach Node Script** window appears, with the fields **Language:**, **Inherits:**,
   **Template:**, **Built-in Script:** and **Path:**. Check the language and the path, then click
   **Create**. For C#, the script's file name needs to match its class name.

**You should see:** the node in the **Scene** dock and its properties in the **Inspector**; after
step 4 the **Script** workspace appears with the new script file open.

## Instance a scene

**When:** a saved scene should appear inside another scene, for example an enemy inside a level.

1. In the **Scene** dock, select the node that will be the parent of the instance.
2. Click the link icon at the top of the **Scene** dock; its tooltip reads
   **Instantiate a scene file as a Node. Creates an inherited scene if no root node exists.**
   Right-clicking the parent and choosing **Instantiate Child Scene...** is the menu route.
3. In the picker that opens, double-click the scene to instance it. The research did not record
   the picker's title or buttons for every version, so do not name them.

Instead of steps 2 and 3, the scene file can be dragged from the **FileSystem** dock onto the
node that should be its parent.

**You should see:** the instance added as a child of the node you selected.

## Create a custom Resource and assign it

**When:** a Resource script exists (stats, item data) and the learner needs a resource file made
from it and used by a node.

1. Make sure the script can be picked: give it a class name in GDScript, or the `[GlobalClass]`
   attribute in C#. Without that the class does not appear in the dialog of step 3.
2. In the **FileSystem** dock, right-click empty space and choose **New Resource...**. When the
   right-click lands on a file or folder, the item is **Create New > Resource...** instead.
3. In the **Create New Resource** dialog, select your class and click **Create**.
4. The research did not record what the editor asks after **Create** (naming and saving the
   file). Complete whatever the editor shows there without quoting labels for it.
5. Double-click the resource file in the **FileSystem** dock to open it for editing, and set its
   properties in the **Inspector**. To save, click the save icon at the top of the **Inspector**
   (its tooltip reads **Save the currently edited resource.**) and choose **Save**.
6. Select the node that should use the resource, then drag and drop the resource file onto that
   property's slot in the **Inspector**. The research did not record the exact clicks on an
   exported property's slot beyond this.

**You should see:** the resource on the node's property in the **Inspector**; clicking the
resource preview there shows the resource's properties.

## Connect a signal

**When:** a node's signal (a button's "pressed", an area's "body_entered") should call a method
in a script. From Godot 4.6 the dock is named Signals, not Node.

1. Select the node that emits the signal in the **Scene** dock.
2. Open the list of signals:
   - **4.3-4.5:** On the right side of the editor, click the **Node** tab next to the **Inspector**, then the **Signals** button inside that dock.
   - **4.6+:** On the right side of the editor, click the **Signals** tab next to the **Inspector**. There is no **Node** tab.
3. Double-click the signal in the list, or right-click it and choose **Connect...**. The
   **Connect a Signal to a Method** window opens.
4. Pick the node that should receive the signal. The simple view only lists nodes that have a
   script attached; the editor generates the receiver method's name for you, by convention
   "_on_node_name_signal_name". To connect to any node or to a built-in function, turn on
   **Advanced**. The **Advanced** toggle is at the bottom-left of the window on every version
   (the docs up to 4.6 say bottom-right).
5. Click **Connect**.

**You should see:** the editor jumps to the **Script** workspace and shows the new method with a
connection icon in the left margin.

## Add a node to a group

**When:** several nodes need a shared tag, for example "enemies" or "collectibles".

1. Select the node in the **Scene** dock.
2. Open the groups list:
   - **4.3-4.5:** On the right side of the editor, click the **Node** tab next to the **Inspector**, then the **Groups** button inside that dock.
   - **4.6+:** On the right side of the editor, click the **Groups** tab, in the same slot as the **Inspector**. There is no **Node** tab.
3. Click the add button with the + symbol; its tooltip reads **Add a new group.**
4. The **Create New Group** dialog appears. Write the group name in the field. Optionally mark
   **Global**, which makes the group visible project-wide and lets you give it a description.
5. Confirm the dialog:
   - **4.3-4.6:** Press the dialog's confirm button. The docs call it "Ok"; the research did not read the button's literal text on these versions.
   - **4.7:** Click **Create**. The docs for this version still say "press Ok".
6. To put another node into a group that already exists, select that node and mark the checkbox
   on the left side of the group.

**You should see:** the new group under **Scene Groups**, or under **Global Groups** if
**Global** was marked, with its checkbox already checked for the node you had selected.

## Register an autoload

**When:** a script or scene should load once at startup and be reachable from everywhere, such
as a game-state or event-bus singleton.

1. Open **Project > Project Settings...**, click the **Globals** tab, then its **Autoload**
   sub-tab. This location is the same on every version.
2. Add the script or scene:
   - **4.3-4.6:** In the **Path:** field, type the file's path (for example res://global.gd) or use the browse button. Set the name in the **Node Name:** field, then press **Add**.
   - **4.7:** Click **Select Script/Scene** and pick the file. It is added immediately, named after the file name converted to PascalCase (game_state.gd becomes GameState; a name that matches a built-in class gets Global appended, so timer.gd becomes TimerGlobal); there are no **Path:** or **Node Name:** fields and no **Add** button. The name column's tooltip reads **Name of the autoload. Double-click to rename.** The docs for this version still say "Press Add".
3. Leave **Enable** checked in the **Global Variable** column (it is checked by default) so
   GDScript can reach the autoload by its name. That column has no effect in C# code.

On Godot 4.7 the tab also has **Create Script** and **Create Scene** buttons; what they open was
not researched, so do not walk a learner through them.

**You should see:** a new entry in the list, under the columns **Name**, **Path** and
**Global Variable**. When the project runs, the autoloaded node appears in the running scene
tree (see Inspect the remote scene tree).

## Add an Input Map action

**When:** code should ask for a named action ("jump", "move_left") instead of a specific key.

1. Open **Project > Project Settings...** and click the **Input Map** tab (some docs pages write
   "InputMap").
2. Type the action's name into the field whose placeholder reads **Add New Action**, then click
   the **Add** button beside it. The docs from Godot 4.7 recommend snake_case names.
3. In the new action's row, click the button whose tooltip reads **Add Event**.
4. A dialog titled **Event Configuration for "<action>"** opens, with the action's name in the
   title. It has a **Filter Inputs** field and the categories **Keyboard Keys**,
   **Mouse Buttons**, **Joypad Buttons** and **Joypad Axes**. The research did not record the
   steps for choosing an input and confirming this dialog, so the recipe stops here: tell the
   learner to choose their input in that dialog and confirm it, without quoting further labels.
5. To look for an action that already exists:
   - **4.3-4.4:** Use the **Filter by Name** field above the list (it has a **Clear All** button). Turn on **Show Built-in Actions** to see the built-in ones.
   - **4.5+:** The research did not record the wording of the filter field above the list on these versions. Turn on **Show Built-in Actions** to see the built-in ones.

Each event under an action has buttons whose tooltips read **Edit Event** and **Remove Event**.

**You should see:** the action in the list, which has the columns **Action** and **Deadzone**.

## Set the main scene

**When:** the project needs to know which scene to start with.

1. Click **Run Project** in the playtest buttons at the top-right of the editor (F5; Cmd + B on
   macOS).
2. If the project has no main scene yet, a popup invites you to select one. Click **Select**.
   The popup also has a **Select Current** button.
3. In the file dialog titled **Pick a Main Scene**, double-click the scene file.

To set or change it at any time, right-click a scene file in the **FileSystem** dock and choose
**Set as Main Scene**. The item is absent from the menu of the scene that already is the main
scene.

The setting can also be changed in **Project > Project Settings...**; the popup says it is under
the 'application' category. The research did not record the label that the **General** tab
shows for it, only its key, application/run/main_scene. Say that much and do not name a label.

**You should see:** **Run Project** runs the scene you chose, with no popup asking for a main
scene.

## Set window size and stretch mode

**When:** the game needs a fixed base resolution and a rule for how it scales to other window
sizes.

1. Open **Project > Project Settings...**; the **General** tab is the first tab.
2. In the left column, open **Display > Window**.
3. Set **Viewport Width** and **Viewport Height** to the base size (the docs' first 2D game uses
   480 and 720).
4. Under the **Stretch** options, set **Mode** and **Aspect**. The docs' first 2D game sets
   Mode to canvas_items and Aspect to keep. The docs name the Mode values Disabled (the
   default), Canvas Items and Viewport, and the Aspect values Ignore, Keep, Keep Width, Keep
   Height and Expand; the research did not settle which spelling the dropdown displays.

The research did not record the sub-headings inside **Display > Window**, nor whether the
**Advanced Settings** toggle must be on to see these settings. If a learner cannot find one, the
**General** tab has a **Filter Settings** search field.

On Godot 4.7 the docs add that, when testing stretch settings, game embedding should be
configured to use the **Stretch to Fit** scaling option. The embedding controls were not
researched; do not describe where that option is.

**You should see:** the four settings showing the values you chose; they give the window its
base size and decide how it stretches.

## Name physics layers

**When:** collision layers are about to be used for more than one kind of object and "layer 3"
is no longer readable.

1. Open **Project > Project Settings...**.
2. In the **General** tab's category list, go to **Layer Names > 2D Physics** (or
   **Layer Names > 3D Physics** for 3D). This is the same on every version.
3. Type a name for each layer you use. The research did not record the field labels there or
   whether the **Advanced Settings** toggle is needed, so do not quote any.
4. On each physics node, set the property the docs call "Layer" to the layer the node is on, and
   the property the docs call "Mask" to the layers it should interact with.

**You should see:** your names kept in **Layer Names**. The research did not record how the
names then show up next to the Layer and Mask properties in the **Inspector**, so do not promise
a particular look.

## Animate a property with AnimationPlayer

**When:** a node's property (position, colour, scale) should change over time on a timeline.

1. Add an AnimationPlayer node (see Add a node and attach a script) and click it. The
   **Animation** panel opens at the bottom of the editor.
2. Click the **Animation** button in the animation editor and choose **New...**. Enter a name in
   the **Create New Animation** dialog and confirm it.
3. Set the animation's length with the controls on the right side of the timeline header; the
   field's tooltip reads **Animation length (seconds)**.
4. With the **Animation** panel still visible, select the node you want to animate. The
   **Inspector** now shows a small keyframe button for each of its properties. Click the one for
   the property you are animating; this adds a track and a keyframe to the current animation. If
   the editor offers to create the track, click **Create**. It will also ask whether to create a
   RESET track automatically.
5. Click on the timeline header at the time of the next keyframe, set the property to its new
   value in the **Inspector**, and click the property's keyframe button again.
6. Play it from the start (Shift + D):
   - **4.3:** Click the button whose tooltip reads **Play selected animation from start. (Shift+D)**
   - **4.4+:** Click the button the docs call "Play from beginning"; its shortcut name is **Play Animation from Start**.
7. Optional: the button whose tooltip reads **Autoplay on Load** makes the animation start with
   the scene, and the toggle whose tooltip reads **Animation Looping** makes it loop.

AnimationPlayer inherits from Node, so do not put nodes that have a 2D or 3D transform under it
as children.

**You should see:** a track for the property in the **Animation** panel with a keyframe at each
time you keyed, and the property changing when the animation plays.

## Create SpriteFrames for AnimatedSprite2D

**When:** an AnimatedSprite2D node needs its frame-by-frame animations.

1. Select the AnimatedSprite2D node and find its SpriteFrames property in the **Inspector**.
2. Create the resource from the property's dropdown:
   - **4.3-4.4:** Choose **New SpriteFrames**.
   - **4.5+:** Choose **SpriteFrames**, listed under the **New** header. The docs still write "New SpriteFrames".
3. Click the new SpriteFrames resource. The **SpriteFrames** panel appears at the bottom of the
   editor window.
4. Drag the individual frame images from the **FileSystem** dock into the centre part of the
   **SpriteFrames** panel. The panel also has an icon button for adding a frame from a file:
   - **4.3-4.5:** It is the icon button whose tooltip reads **Add frame from file**.
   - **4.6+:** It is the icon button whose tooltip reads **Add Frame from File**.
5. If the frames are in one sprite sheet, use the sprite sheet button instead:
   - **4.3-4.5:** Click the icon button whose tooltip reads **Add frames from sprite sheet**.
   - **4.6+:** Click the icon button whose tooltip reads **Add Frames from Sprite Sheet**.
6. Only for a sprite sheet: open the file when prompted. In the **Select Frames** window, set
   **Horizontal** and **Vertical** to the number of images across and down, select the frames
   (there are **Select All** and **Select None** buttons), then click the confirm button, which
   carries the number of frames selected (the docs show "Add 4 frames").
7. On the left side of the panel, double-click "default" to rename the animation.
8. Set the speed. The docs call the setting "Speed (FPS)"; the control's tooltip reads
   **Animation Speed** and its suffix is **FPS**. The research did not settle where on the panel
   it sits.
9. Preview with the "Play" buttons at the top-right of the **Filter Animations** input. To add
   another animation, click the icon button whose tooltip reads **Add Animation**.

**You should see:** the frames in the centre of the **SpriteFrames** panel under the animation
name you gave, and the animation playing when you preview it.

## Create a TileSet and paint a TileMapLayer

**When:** a 2D level should be built from a tilesheet image.

1. Create a TileMapLayer node (see Add a node and attach a script), select it, and create a new
   TileSet resource from the TileSet property's dropdown in the **Inspector**:
   - **4.3-4.4:** Choose **New TileSet**.
   - **4.5+:** Choose **TileSet**, listed under the **New** header.
2. Click the new TileSet value to unfold it in the **Inspector** and set the tile size (the docs'
   example uses 64×64). Do this before the next step: the tile size must be set before the atlas
   is created.
3. Open the **TileSet** panel:
   - **4.3-4.5:** Click the **TileSet** button at the bottom of the editor.
   - **4.6+:** Click the **TileSet** tab at the bottom of the editor.
4. Click and drag the tilesheet image onto the **TileSet** panel. When asked whether to create
   tiles automatically, answer **Yes**.
5. Select the TileMapLayer node, then open the **TileMap** panel:
   - **4.3-4.5:** Click the **TileMap** button at the bottom of the editor.
   - **4.6+:** Click the **TileMap** tab at the bottom of the editor.
6. Click a tile in the **TileMap** panel, or hold the mouse button down to select several.
7. Pick the paint tool (the docs call it "Paint"):
   - **4.3:** It is the icon button whose tooltip reads **Paint**.
   - **4.4+:** It is the icon button whose tooltip reads **Paint Tool**.
8. Left-click to place the selected tile; right-click erases.

The **TileSet** and **TileMap** panels exist only while a TileSet or a TileMapLayer is being
edited. A learner who cannot find them needs to select the TileMapLayer node first.

**You should see:** the tilesheet's tiles in the **TileSet** panel after step 4, and a tile
placed on the TileMapLayer with each left-click.

## Change import settings and reimport

**When:** an imported asset needs different import parameters from the ones it was imported
with.

1. Select the asset in the **FileSystem** dock.
2. Open the **Import** dock. By default it is the second tab in the left-side upper slot, after
   **Scene**; see [editor-navigation.md](editor-navigation.md) if it is closed.
3. Change the import parameters. The research did not record the individual options for any
   resource type, so name an option only if the learner reads it out.
4. Click **Reimport**; once a parameter has been changed the button reads **Reimport (*)**. Do
   it before selecting another file in the **FileSystem** dock, or the changes are discarded.

To change several assets at once, select them together in the **FileSystem** dock; a checkbox
then appears to the left of every import parameter. The **Preset** button has
**Set as Default for '<type>'**; **Load Default** and **Clear Default for '<type>'** are listed
there only once a default exists for that type. Project-wide defaults are on the
**Import Defaults** tab of the Project Settings.

**You should see:** the **Import** dock listing the selected asset's parameters instead of the
message "Select a resource file in the filesystem or in the inspector to adjust import
settings.", and the asset using the new parameters after **Reimport**.

## Create a Theme and assign it

**When:** a UI should share one look (fonts, colours, button styles) instead of per-node
overrides.

1. Select a Control node in the **Scene** dock. A theme set on it is what this recipe creates
   and assigns in one go.
2. In the **Inspector**, go to the property the docs write as `theme`.
3. Create the resource from the property's dropdown:
   - **4.3-4.4:** Choose **New Theme**.
   - **4.5+:** Choose **Theme**, listed under the **New** header. The docs still write "New Theme".
4. Select the new Theme for editing. The theme editor is the **Theme** bottom panel; it activates
   automatically when a Theme resource is selected for editing.
5. A theme created this way is bundled with the scene. To keep it as a file, the docs say to
   "use the context menu" without naming the item; the property's dropdown lists **Save** and
   **Save As...** once a resource is set.

To create the theme as a file from the start, right-click in the **FileSystem** dock, choose
**New Resource...**, select **Theme** and click **Create**. The research does not give a click
path for assigning an existing theme file to a Control, so do not invent one.

**You should see:** the **Theme** panel at the bottom of the editor, with the
**Default Preview** tab visible on its left side.

## Add a translation file

**When:** the project has a translation file ready and the game should load it.

1. Open **Project > Project Settings...** and click the **Localization** tab.
2. Click the **Translations** sub-tab; it is the first one. The sub-tab is there on every
   version, although the docs for Godot 4.3 to 4.5 name only "Project Settings > Localization".
3. Click **Add...**.
4. The research did not record the file dialog that follows or the file types it shows, so the
   recipe stops here: tell the learner to pick their translation file in that dialog.

A CSV file is not itself what the game loads: the editor imports it and generates one or more
translation resource files next to it, named after the CSV with the locale and the extension
.translation (strings.csv with an "en" column gives strings.en.translation). The docs add that
importing also adds the translation to the list; the research did not confirm that in the
engine, nor which files the dialog after **Add...** offers for a CSV, so say that this part is
not covered.

**You should see:** the translation listed in the **Translations** sub-tab, which is where
translations are added and removed project-wide.

## Install and enable an addon

**When:** the learner wants an add-on from the asset library, or has downloaded one as a ZIP.

1. Open the asset library inside the editor:
   - **4.3-4.6:** Click **AssetLib** at the top of the editor.
   - **4.7:** Click **Asset Store** at the top of the editor. The docs for this version still say "AssetLib".
2. Find the add-on and use its **Download** button. The research did not record the install
   dialog that follows, so do not quote its options or its confirm button.
3. If the add-on came as a ZIP instead: extract it and move the addons/ folder it contains into
   the project folder. If the project already has an addons/ folder, move the plugin's addons/
   folder into the project folder to merge the two.
4. An add-on with a plugin.cfg file in its folder under addons/ is an editor plugin and must be
   enabled; a scripts-only add-on needs no enabling. Open **Project > Project Settings...** and
   click the **Plugins** tab.
5. Find the plugin under **Installed Plugins:** and tick its checkbox in the **Enabled** column;
   the checkbox carries the text **On**. The docs call it the "Enable" checkbox.

**You should see:** the plugin in the list of plugins with its checkbox ticked. It can be used
immediately; there is no need to restart the editor.

## Create an export preset

**When:** the game should be built for a platform for the first time.

1. Open **Project > Export...**. The window is titled **Export**.
2. Click **Add...** at the top of the window, under the **Presets** label, and choose a platform
   from the drop-down list.
3. The preset has the fields **Name** and **Runnable** and the tabs **Options**, **Resources**,
   **Features**, **Encryption** and **Scripts**, plus one more depending on the version:
   - **4.3:** There is no further tab.
   - **4.4-4.5:** There is also a **Patches** tab.
   - **4.6+:** There is also a **Patching** tab.
4. If the window complains that export templates are missing, it shows a
   **Manage Export Templates** link. **Editor > Manage Export Templates...** opens the window
   titled **Export Template Manager**. Install the templates there:
   - **4.3-4.6:** Click **Download and Install**. There is also an **Install from File** button.
   - **4.7:** Check the box for the platform and architecture you want, then click **Install Selected Templates**. With no box checked the same button reads **Install All Templates**.
5. The buttons at the bottom of the **Export** window are **Export All...**,
   **Export Project...**, **Export PCK/ZIP...** and **Close**. The research did not record the
   per-platform options, the export path field, or the dialog after **Export Project...**, so
   the recipe stops here.

The file export_presets.cfg can be committed to version control;
.godot/export_credentials.cfg should generally not be.

**You should see:** the new preset under **Presets**. The window complains when something is
missing and does not allow exporting for that platform until it is resolved.

## Inspect the remote scene tree

**When:** something is wrong in the running game and the learner needs to see which nodes exist
right now, including autoloads and nodes created from code.

1. Run the project from the editor with **Run Project** or **Run Current Scene**, at the
   top-right of the editor.
2. Focus back on the editor. Two options have appeared at the top of the **Scene** dock:
   **Remote** and **Local**. Click **Remote**.
3. While **Remote** is in use you can inspect or change the nodes' parameters in the running
   project. The research did not record further labels for this, so describe it in those words.
4. **Local** is the other option; click it to leave **Remote**.

**You should see:** **Remote** and **Local** at the top of the **Scene** dock while the game
runs, and the autoloaded nodes in the running scene tree.

## Show collision shapes and use the profiler

**When:** a collision does not behave as expected, or the game runs slowly and the learner needs
to see where the time goes.

1. Open the **Debug** menu at the top of the editor and turn on **Visible Collision Shapes**.
2. Run the project. Collision shapes and raycast nodes, 2D and 3D, are now visible in the running
   project.
3. For the profiler, keep the game running and focus back on the editor, then open the debugger:
   - **4.3-4.5:** Click the **Debugger** button at the bottom of the editor.
   - **4.6+:** Click the **Debugger** tab at the bottom of the editor.
4. Click the **Profiler** tab inside it.
5. Click **Start** in the top-left corner of the **Profiler** tab; it becomes **Stop** while
   profiling.
   - **4.3:** There is no autostart option; click **Start** on each run.
   - **4.4+:** You can also check **Autostart**, which makes the profiler start automatically the next time the project is run.
6. Click on the graph to choose which frame's information is listed. Under the Script functions,
   turn on the checkboxes of functions to find which take time. The **Measure** drop-down
   changes the type of data measured, and **Clear** clears the data.

The profiler does not support C# scripts.

**You should see:** the collision shapes drawn in the running project, and in the **Profiler**
tab the **Start** button reading **Stop** while it profiles, above a graph you can click.
