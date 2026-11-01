# Apex Strikers — clean boss encounters

Approved user spec, baseline dba210d81b94e74ba4fdb8573f8f9c1d2f3f6e04:

- Remove plasma circular hazards and black holes, including jam/gravity/projectile absorption. Remove indestructible boss decoys and retaliation. Preserve protective shields, destructible turrets, laser warnings and the original defense-grid slots.
- On capital-ship entry, shatter all loose pickups once without collecting/rewarding them. Keep already collected powers and allow new supplies/drops and phase changes without another pickup purge.
- Stage/Practice boss packet density1.25, same arc/speed and90-unit escape passage; support caps6/8/10. Stagger a third support at the existing wave clock so the cap increase produces actual additional pressure. Endless retains legacy packet density and4/6/8 caps/two-ship waves.
- Stage3 friendly damage to ordinary enemy hulls/armor/shields/supports is1.2 times current damage, once, for guns/beams/missiles/escorts. Boss cores/turrets and minibosses are unchanged. Endless has no new impact bonus.
- Deepen music playback behind AudioDirector's existing interface: desired versus confirmed playback, bounded retries,400ms handoff only after successful play, keep prior music during delay/failure, cancel stale play after pause/navigation. Preserve music positions, mute and phase continuity.
- Verify model and browser behavior, actual desktop playback versus simulated failure separately, small mobile layouts/reduced effects, no20-minute Endless. Record before/after, Spec/Standards review, commit and publish same GitHub/public URL. No save or input preference migration.
