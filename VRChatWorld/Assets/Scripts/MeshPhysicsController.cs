
using UdonSharp;
using UnityEngine;
using VRC.SDKBase;
using VRC.Udon;

[UdonBehaviourSyncMode(BehaviourSyncMode.None)]
public class MeshPhysicsController : UdonSharpBehaviour
{
    [Header("Resonance Settings")]
    public float baseGravity = -9.81f;
    public float resonanceIntensity = 1.0f;
    public float pulseFrequency = 2.0f;

    [Header("Nexus Core")]
    public Transform nexusCore;
    public float coreForceRadius = 15.0f;
    public float coreAttractionForce = 5.0f;

    private float _timer = 0;
    private VRCPlayerApi _localPlayer;

    void Start()
    {
        _localPlayer = Networking.LocalPlayer;
        if (_localPlayer == null) return;
        
        // Initialize world gravity
        Physics.gravity = new Vector3(0, baseGravity, 0);
    }

    void Update()
    {
        if (_localPlayer == null) return;

        _timer += Time.deltaTime;

        // 1. Calculate Sinusoidal Resonance Pulse
        float resonanceFactor = Mathf.Sin(_timer * pulseFrequency) * 0.5f + 0.5f;
        resonanceIntensity = resonanceFactor; // Sync this with visuals elsewhere

        // 2. Adjust Gravity based on Resonance
        // Low resonance = normal gravity. High resonance = low gravity (floaty).
        float targetGravity = baseGravity * (1.1f - (resonanceFactor * 0.8f));
        Physics.gravity = new Vector3(0, targetGravity, 0);

        // 3. Local Player Physics Override (Floatiness near Core)
        if (nexusCore != null)
        {
            float dist = Vector3.Distance(_localPlayer.GetPosition(), nexusCore.position);
            if (dist < coreForceRadius)
            {
                // Calculate pull toward core
                Vector3 dir = (nexusCore.position - _localPlayer.GetPosition()).normalized;
                float strength = (1.0f - (dist / coreForceRadius)) * coreAttractionForce;
                
                // Note: VRCPlayerApi.SetVelocity() is the standard way to move players physically
                Vector3 currentVel = _localPlayer.GetVelocity();
                _localPlayer.SetVelocity(currentVel + (dir * strength * Time.deltaTime));
            }
        }
    }

    public void OnResonanceBurst()
    {
        // Triggered by WorldController or InteractButton
        // Give everyone a slight upward bump
        if (_localPlayer != null)
        {
            Vector3 vel = _localPlayer.GetVelocity();
            _localPlayer.SetVelocity(new Vector3(vel.x, vel.y + 5.0f, vel.z));
        }
    }
}
