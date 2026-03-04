using UdonSharp;
using UnityEngine;
using VRC.SDKBase;
using VRC.Udon;

/// <summary>
/// MirrorToggle — Lets players toggle the VRC Mirror on or off.
/// Attach to a button or trigger collider.
/// </summary>
[UdonBehaviourSyncMode(BehaviourSyncMode.None)]
public class MirrorToggle : UdonSharpBehaviour
{
    [Tooltip("The VRC_MirrorReflection GameObject to toggle")]
    public GameObject mirrorObject;

    private bool _mirrorOn = false;

    public override void Interact()
    {
        Toggle();
    }

    public void Toggle()
    {
        _mirrorOn = !_mirrorOn;
        if (mirrorObject != null) mirrorObject.SetActive(_mirrorOn);
        Debug.Log($"[MirrorToggle] Mirror is now {(_mirrorOn ? "ON" : "OFF")}");
    }
}
