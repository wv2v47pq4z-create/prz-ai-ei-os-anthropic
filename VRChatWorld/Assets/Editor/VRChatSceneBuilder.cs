using UnityEditor;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEditor.SceneManagement;
using System.IO;

/// <summary>
/// PRZ-OS VRChat World Scene Builder — Editor-only tool.
/// Run via Window > PRZ-OS > Build VRChat Scene to auto-configure the scene.
/// </summary>
public class VRChatSceneBuilder : EditorWindow
{
    [MenuItem("Window/PRZ-OS/Build VRChat Scene")]
    public static void ShowWindow()
    {
        GetWindow<VRChatSceneBuilder>("PRZ-OS Scene Builder");
    }

    private void OnGUI()
    {
        GUILayout.Label("PRZ-OS VRChat World Builder", EditorStyles.boldLabel);
        GUILayout.Space(10);

        if (GUILayout.Button("🏗️  Auto-Build World Scene", GUILayout.Height(40)))
        {
            BuildScene();
        }

        GUILayout.Space(5);
        EditorGUILayout.HelpBox(
            "This will populate the active scene with:\n" +
            "• Directional Light (Sun)\n" +
            "• Floor plane (20x20)\n" +
            "• VRCWorld spawn descriptor\n" +
            "• Mirror + toggle button\n" +
            "• Player tracker canvas\n" +
            "• Interact button",
            MessageType.Info);
    }

    private static void BuildScene()
    {
        Debug.Log("[PRZ-OS] Starting VRChat scene build...");

        // ── Floor ─────────────────────────────────────────────────────────
        GameObject floor = GameObject.CreatePrimitive(PrimitiveType.Cube);
        floor.name = "Floor";
        floor.transform.position = Vector3.zero;
        floor.transform.localScale = new Vector3(20f, 0.1f, 20f);
        SetMaterialColor(floor, new Color(0.18f, 0.18f, 0.22f)); // dark slate

        // ── Directional Light (Sun) ────────────────────────────────────────
        GameObject sunGO = new GameObject("Sun_Directional");
        Light sun = sunGO.AddComponent<Light>();
        sun.type = LightType.Directional;
        sun.color = new Color(1f, 0.95f, 0.84f);
        sun.intensity = 1.1f;
        sun.shadows = LightShadows.Soft;
        sunGO.transform.rotation = Quaternion.Euler(50f, -30f, 0f);
        sunGO.transform.position = new Vector3(0f, 10f, 0f);

        // ── Ambient platform ──────────────────────────────────────────────
        RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Skybox;
        RenderSettings.ambientIntensity = 1.0f;

        // ── Mirror ─────────────────────────────────────────────────────────
        GameObject mirror = GameObject.CreatePrimitive(PrimitiveType.Quad);
        mirror.name = "Mirror";
        mirror.transform.position = new Vector3(0f, 1.5f, -9f);
        mirror.transform.localScale = new Vector3(3f, 3f, 1f);
        mirror.transform.rotation = Quaternion.Euler(0f, 180f, 0f);
        // VRC_MirrorReflection component added at runtime if SDK available
        SetMaterialColor(mirror, Color.white);

        // ── Mirror Toggle Button ───────────────────────────────────────────
        GameObject mirrorBtn = GameObject.CreatePrimitive(PrimitiveType.Cube);
        mirrorBtn.name = "MirrorToggleButton";
        mirrorBtn.transform.position = new Vector3(1.5f, 1f, -9f);
        mirrorBtn.transform.localScale = new Vector3(0.3f, 0.3f, 0.3f);
        SetMaterialColor(mirrorBtn, new Color(0.15f, 0.6f, 1f));

        // ── Spawn Point ────────────────────────────────────────────────────
        GameObject spawn = new GameObject("SpawnPoint");
        spawn.transform.position = new Vector3(0f, 0.1f, 0f);

        // ── Interact / Teleport Button ─────────────────────────────────────
        GameObject interactBtn = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        interactBtn.name = "TeleportButton";
        interactBtn.transform.position = new Vector3(3f, 0.6f, 3f);
        interactBtn.transform.localScale = new Vector3(0.5f, 0.1f, 0.5f);
        SetMaterialColor(interactBtn, new Color(0.6f, 0.1f, 1f));

        // ── Canvas (PlayerTracker UI) ──────────────────────────────────────
        GameObject canvasGO = new GameObject("PlayerTrackerCanvas");
        Canvas canvas = canvasGO.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.WorldSpace;
        canvasGO.transform.position = new Vector3(-5f, 2f, -9f);
        canvasGO.transform.localScale = Vector3.one * 0.01f;
        canvasGO.transform.rotation = Quaternion.Euler(0f, 180f, 0f);
        var cr = canvasGO.AddComponent<UnityEngine.UI.CanvasScaler>();
        cr.scaleFactor = 1f;

        // Background panel
        GameObject panel = new GameObject("Background");
        panel.transform.SetParent(canvasGO.transform, false);
        var img = panel.AddComponent<UnityEngine.UI.Image>();
        img.color = new Color(0.05f, 0.05f, 0.1f, 0.85f);
        var panelRect = panel.GetComponent<RectTransform>();
        panelRect.sizeDelta = new Vector2(300f, 400f);

        // ── Nexus Core ───────────────────────────────────────────────────
        GameObject nexus = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        nexus.name = "PRZ-OS_Nexus_Core";
        nexus.transform.position = new Vector3(0f, 5f, 0f);
        nexus.transform.localScale = Vector3.one * 2f;
        SetMaterialColor(nexus, new Color(1f, 0.4f, 1f)); // Glowing Magenta

        // ── Data Packets (Physics Objects) ───────────────────────────────
        for (int i = 0; i < 3; i++)
        {
            GameObject packet = GameObject.CreatePrimitive(PrimitiveType.Cube);
            packet.name = $"DataPacket_0{i}";
            packet.transform.position = new Vector3(-2f + (i * 2f), 1f, 2f);
            packet.transform.localScale = Vector3.one * 0.4f;
            packet.AddComponent<Rigidbody>();
            SetMaterialColor(packet, new Color(0f, 0.8f, 1f)); // Cyber Cyan
        }

        Debug.Log("[PRZ-OS] ✅ VRChat scene built successfully. Open scene in Unity to attach scripts and VRCWorld prefab.");
        EditorSceneManager.MarkSceneDirty(SceneManager.GetActiveScene());

        EditorUtility.DisplayDialog(
            "PRZ-OS Build Complete ✅",
            "World scene configured with PRZ-OS Physics elements!\n\nNext steps:\n1. Drag 'VRCWorld' prefab into Hierarchy\n2. Attach WorldController.cs to VRCWorld\n3. Attach MeshPhysicsController.cs to the PRZ-OS_Nexus_Core\n4. Attach DataPacket.cs to the DataPackets\n5. SDK > Build & Publish",
            "Got it!"
        );
    }

    private static void SetMaterialColor(GameObject go, Color color)
    {
        var rend = go.GetComponent<Renderer>();
        if (rend == null) return;
        var mat = new Material(Shader.Find("Standard"));
        mat.color = color;
        rend.material = mat;
    }
}
