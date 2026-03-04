# PRZ-OS VRChat World

A VRChat world built inside the PRZ-AI-EI-OS Anthropic project, managed and deployed through the PRZ-OS v3.0 mesh agent system.

## 📁 Structure

```
VRChatWorld/
├── Assets/
│   ├── Editor/
│   │   ├── VRChatSceneBuilder.cs     ← PRZ-OS auto scene builder (Editor tool)
│   │   └── PrzAiEiOsEditor.asmdef
│   ├── Scripts/
│   │   ├── WorldController.cs        ← Main world logic + day/night cycle
│   │   ├── InteractButton.cs         ← Udon-wired interact buttons
│   │   ├── PlayerTracker.cs          ← Live player list UI
│   │   ├── MirrorToggle.cs           ← VRChat mirror on/off toggle
│   │   └── PrzAiEiOsWorld.asmdef
│   └── Scenes/
│       └── VRChatWorld.unity
├── Packages/
│   ├── com.vrchat.worlds/            ← VRChat Worlds SDK v3.10.2
│   ├── com.vrchat.base/              ← VRChat Base SDK v3.10.2
│   ├── manifest.json
│   └── vpm-manifest.json
└── .gitignore
```

## 🚀 How to Open in Unity

1. Open **Unity Hub**
2. Click **Add** → select `VRChatWorld/` folder
3. Open the project (uses Unity 6000.3.10f1)
4. Wait for the VRChat SDK to import

## 🏗️ Auto-Build the Scene

Once open in Unity:

1. Go to **Window → PRZ-OS → Build VRChat Scene**
2. Click **"Auto-Build World Scene"**
3. This creates: Floor, Sun, Mirror, Spawn Point, Player Tracker Canvas, Teleport Button
4. Drag the **VRCWorld** prefab from `Packages/com.vrchat.worlds/Samples/` into the Hierarchy
5. Assign scripts in the Inspector as prompted

## 📤 Publish to VRChat

1. Log in via **VRChat SDK → Show Control Panel → Authentication**
2. Go to **Builder → Build & Publish for Windows**
3. Fill in world name/description and click Publish

## 🤖 Coding Agent

The autonomous error-fixing agent lives in `../CodingAgent/`.

```bash
cd CodingAgent
cp .env.example .env         # add your ANTHROPIC_API_KEY
npm install
npm start                    # watches Unity logs and auto-fixes CS errors
```
