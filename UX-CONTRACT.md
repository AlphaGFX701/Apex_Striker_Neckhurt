# Gyro Space Combat — interaction contract

## Product evidence

The user-approved requirements are in ONSLAUGHT-PLAN.md. The subsequent soundtrack override selects Terminal_Dash for assaults and ORBITAL BOMBARDMENT for capital ships. Audio source verification is recorded in AUDIO-PROVENANCE.md; the supplied NPC recording must never be labelled as item announcements.

## Canonical UI Map

| Capability     | Canonical owner                                       | Source of truth          | Allowed variants                                     | Verification                         |
| -------------- | ----------------------------------------------------- | ------------------------ | ---------------------------------------------------- | ------------------------------------ |
| Select/Listbox | Native labelled select in screens.ts / Controller Lab | This contract            | Platform-owned mobile popup                          | Browser keyboard and narrow viewport |
| Scrollbar      | Global style.css                                      | DESIGN.md runtime tokens | Document menus; fixed battle with no document scroll | Layout measurements                  |
| Toast          | main.ts toast() with #toast live region               | This contract            | Transient status; errors also remain in owning panel | Browser permission/launch failure    |
| Overlay        | Native dialog                                         | This contract            | Pause, leave run, discard appearance, help           | Focus, cancel, resume                |

Native select popup geometry and OS interaction are intentional. No authored replacement is required. There are no searchable tables, purchases, accounts or server mutations.

## Navigation and drafts

Home leads to Missions or Hangar. Missions chooses stage and weapon before Preflight. Appearance is a draft until Save; leaving a dirty Hangar confirms discard. Equipment is a free weapon choice, with no permanent strength or economy controls. Settings and Controller Lab return to the screen that opened them. Returning to a paused battle does not automatically resume it.

## Battle lifecycle

The model owns combat, collision and reward rules. DOM menus cannot dispatch game actions. Pause, app loss, stale sensors, controller loss and orientation changes clear transient input. Phone orientation changes require calibration before Resume. Only releasing the movement touch pointer invokes Smart Pause; skill finger releases do not. Resume grants 0.6 seconds of protection and never counts down. Boss combat has no timeout. A run settles once; Practice never writes records. Onslaught records use their own key while older records remain stored.

## Feedback and access

English is the sole app locale. Device names are shown exactly as reported. Color supplements semantic shapes and text. Hull has three segments; shield and escorts have distinct indicators. Cooldown states match on both Warp buttons. EMP uses a percentage gauge. Controls have at least 44×44px targets, visible focus, pressed and disabled states. Dialogs have visible accessible titles and Cancel is initially focused for destructive confirmations. Keyboard movement and controller navigation are alternatives to dragging.

## Failure recovery

Permission denial, missing sensor data and insecure transport show an actionable status and allow another input source. Failed local saves remain playable with an explicit session-only status. Missing audio is optional; wrong speech is never substituted as a named recording. Diagnostic observations are labelled Live Controller or simulated input and do not imply physical device compatibility.
