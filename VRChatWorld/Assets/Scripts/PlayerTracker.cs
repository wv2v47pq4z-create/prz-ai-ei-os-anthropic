using UdonSharp;
using UnityEngine;
using TMPro;
using VRC.SDKBase;
using VRC.Udon;

/// <summary>
/// PlayerTracker — Shows real-time player count and names on a TextMeshPro display.
/// Attach to the world canvas UI element.
/// </summary>
[UdonBehaviourSyncMode(BehaviourSyncMode.None)]
public class PlayerTracker : UdonSharpBehaviour
{
    [Header("Display")]
    [Tooltip("TextMeshPro field to show player info")]
    public TextMeshProUGUI displayText;

    [Tooltip("How often (seconds) to refresh the count")]
    public float refreshInterval = 3f;

    private void Start()
    {
        SendCustomEventDelayedSeconds(nameof(RefreshDisplay), refreshInterval);
    }

    public void RefreshDisplay()
    {
        int count = VRCPlayerApi.GetPlayerCount();
        VRCPlayerApi[] players = new VRCPlayerApi[count];
        VRCPlayerApi.GetPlayers(players);

        string list = $"<b>Players Online: {count}</b>\n";
        foreach (VRCPlayerApi p in players)
        {
            if (p == null) continue;
            string tag = p.isLocal ? " <color=#FFD700>[YOU]</color>" : "";
            list += $"• {p.displayName}{tag}\n";
        }

        if (displayText != null) displayText.text = list;

        // Schedule next refresh
        SendCustomEventDelayedSeconds(nameof(RefreshDisplay), refreshInterval);
    }

    public override void OnPlayerJoined(VRCPlayerApi player)  => RefreshDisplay();
    public override void OnPlayerLeft(VRCPlayerApi player)    => RefreshDisplay();
}
