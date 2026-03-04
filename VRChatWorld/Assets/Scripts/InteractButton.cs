using UdonSharp;
using UnityEngine;
using VRC.SDKBase;
using VRC.Udon;

/// <summary>
/// InteractButton — A clickable in-world button that triggers a UdonBehaviour event.
/// Add this script to any GameObject with a collider. Players can point and click to activate.
/// </summary>
[UdonBehaviourSyncMode(BehaviourSyncMode.None)]
public class InteractButton : UdonSharpBehaviour
{
    [Header("Target")]
    [Tooltip("UdonBehaviour to invoke when this button is pressed")]
    public UdonBehaviour targetBehaviour;

    [Tooltip("The name of the public Udon event method to call on the target")]
    public string eventName = "TeleportToSpawn";

    [Header("Visuals")]
    [Tooltip("Renderer of the button mesh to animate press colour")]
    public Renderer buttonRenderer;
    public Color defaultColor = new Color(0.15f, 0.6f, 1f);
    public Color pressedColor = new Color(1f, 0.4f, 0.1f);

    private Material _mat;
    private bool _pressed = false;

    private void Start()
    {
        if (buttonRenderer != null)
        {
            _mat = buttonRenderer.material;
            _mat.color = defaultColor;
            _mat.EnableKeyword("_EMISSION");
            _mat.SetColor("_EmissionColor", defaultColor * 0.6f);
        }
    }

    public override void Interact()
    {
        if (_pressed) return;
        _pressed = true;
        Debug.Log($"[InteractButton] '{eventName}' triggered by {Networking.LocalPlayer.displayName}.");

        // Flash the button colour
        if (_mat != null)
        {
            _mat.color = pressedColor;
            _mat.SetColor("_EmissionColor", pressedColor * 0.8f);
        }

        // Invoke the target UdonBehaviour
        if (targetBehaviour != null)
        {
            targetBehaviour.SendCustomEvent(eventName);
        }

        SendCustomEventDelayedSeconds(nameof(ResetButton), 1.5f);
    }

    public void ResetButton()
    {
        _pressed = false;
        if (_mat != null)
        {
            _mat.color = defaultColor;
            _mat.SetColor("_EmissionColor", defaultColor * 0.6f);
        }
    }
}
