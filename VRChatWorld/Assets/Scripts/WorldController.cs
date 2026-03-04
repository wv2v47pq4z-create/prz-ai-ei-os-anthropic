using UdonSharp;
using UnityEngine;
using VRC.SDKBase;
using VRC.Udon;
using VRC.SDK3.Components;

/// <summary>
/// WorldController — Main Udon# script for the VRChat World.
/// Handles player joins, ambient audio, and interaction tracking.
/// </summary>
[UdonBehaviourSyncMode(BehaviourSyncMode.Manual)]
public class WorldController : UdonSharpBehaviour
{
    [Header("World Settings")]
    [Tooltip("Name displayed in the world greeting")]
    public string worldName = "PRZ AI EI OS World";

    [Header("Spawn Settings")]
    [Tooltip("Array of spawn points for players")]
    public Transform[] spawnPoints;

    [Header("Ambient Audio")]
    [Tooltip("AudioSource to play ambient sounds")]
    public AudioSource ambientAudio;

    [Header("Day/Night Cycle")]
    [Tooltip("Directional Light representing the sun")]
    public Light sunLight;
    [Tooltip("How long a full day cycle takes in seconds")]
    public float dayLengthSeconds = 300f;

    private float _dayTimer = 0f;

    private void Start()
    {
        Debug.Log($"[WorldController] Initializing world: {worldName}");

        if (ambientAudio != null)
        {
            ambientAudio.loop = true;
            ambientAudio.Play();
        }
    }

    private void Update()
    {
        // Advance the day/night cycle
        if (sunLight != null)
        {
            _dayTimer += Time.deltaTime;
            float progress = (_dayTimer % dayLengthSeconds) / dayLengthSeconds; // 0..1
            float angle = progress * 360f - 90f;                                // -90 to 270 degrees
            sunLight.transform.rotation = Quaternion.Euler(angle, -30f, 0f);

            // Adjust intensity: brighter at noon, darker at night
            float intensity = Mathf.Clamp01(Mathf.Sin(progress * Mathf.PI));
            sunLight.intensity = Mathf.Lerp(0.05f, 1.2f, intensity);
        }
    }

    /// <summary>
    /// Called automatically by VRChat when a player joins.
    /// </summary>
    public override void OnPlayerJoined(VRCPlayerApi player)
    {
        if (player.isLocal)
        {
            Debug.Log($"[WorldController] Welcome, {player.displayName}, to {worldName}!");
        }
        else
        {
            Debug.Log($"[WorldController] {player.displayName} joined the world.");
        }
    }

    /// <summary>
    /// Called automatically by VRChat when a player leaves.
    /// </summary>
    public override void OnPlayerLeft(VRCPlayerApi player)
    {
        Debug.Log($"[WorldController] {player.displayName} left the world.");
    }

    /// <summary>
    /// Public method that can be called from Udon Buttons or triggers.
    /// Teleports local player to a random spawn point.
    /// </summary>
    public void TeleportToSpawn()
    {
        VRCPlayerApi localPlayer = Networking.LocalPlayer;
        if (localPlayer == null || spawnPoints == null || spawnPoints.Length == 0) return;

        int index = Random.Range(0, spawnPoints.Length);
        localPlayer.TeleportTo(
            spawnPoints[index].position,
            spawnPoints[index].rotation,
            VRC_SceneDescriptor.SpawnOrientation.AlignPlayerWithSpawnPoint,
            false
        );
        Debug.Log($"[WorldController] Teleported {localPlayer.displayName} to spawn #{index}.");
    }
}
