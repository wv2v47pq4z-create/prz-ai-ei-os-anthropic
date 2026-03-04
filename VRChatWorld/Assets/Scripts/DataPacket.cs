
using UdonSharp;
using UnityEngine;
using VRC.SDKBase;
using VRC.Udon;

[UdonBehaviourSyncMode(BehaviourSyncMode.Continuous)]
public class DataPacket : UdonSharpBehaviour
{
    [Header("Data Properties")]
    public Color packetColor = Color.cyan;
    public float scalePulse = 0.5f;
    
    [UdonSynced] private bool _isBound = false;
    
    private Rigidbody _rb;
    private MeshRenderer _renderer;
    private Vector3 _baseScale;

    void Start()
    {
        _rb = GetComponent<Rigidbody>();
        _renderer = GetComponent<MeshRenderer>();
        _baseScale = transform.localScale;
        
        if (_renderer != null)
        {
            _renderer.material.color = packetColor;
        }
    }

    void Update()
    {
        // Pulse scale based on "Mesh Activity" (simulated via time)
        float pulse = 1.0f + Mathf.Sin(Time.time * 3.0f) * scalePulse;
        transform.localScale = _baseScale * pulse;

        // If high gravity is detected, glow brighter
        if (Physics.gravity.y > -2.0f)
        {
             _renderer.material.SetColor("_EmissionColor", packetColor * 2.0f);
        }
        else
        {
             _renderer.material.SetColor("_EmissionColor", packetColor * 0.5f);
        }
    }

    public override void OnPickup()
    {
        _isBound = true;
        Networking.SetOwner(Networking.LocalPlayer, gameObject);
        RequestSerialization();
    }

    public override void OnDrop()
    {
        _isBound = false;
        RequestSerialization();
    }
}
