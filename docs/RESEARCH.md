# Workflow research and product boundaries

Reviewed 2026-11-10. Sources are first-party REAPER pages, located through web search.

- [REAPER overview](https://www.reaper.fm/): the desktop product covers multitrack audio/MIDI recording, editing, processing, mixing, and mastering. This breadth is deliberately not the prototype's scope.
- [About REAPER](https://www.reaper.fm/about.php): quick startup, arranging, editing, real-time FX, and nondestructive work are prominent workflow themes.
- [Official user guide](https://www.reaper.fm/userguide.php): recording, editing, and mixing are connected as one practical workflow.
- [Official training videos](https://www.reaper.fm/videos.php): track creation, multi-track recording, and media editing form a useful learning path.

## What Trackstead takes from the workflow

1. A track is a place for audio, with simple arm/mute/solo/gain/pan controls.
2. A clip is a reference to a segment of a source, not a destructive rewrite of it.
3. Recording/import, arrangement, and rendering live in one understandable room.
4. Fast split/duplicate/undo operations make exploration cheap.
5. A saveable project should contain enough information to reconstruct the session.

## What stays original

Trackstead uses a warm graphite and sage studio identity, wide colored wave lanes, a compact inspector, and a simple horizontal mixer. It does not reproduce REAPER's menus, theme, toolbars, logos, screenshots, code, file format, or proprietary assets. The demo is algorithmically synthesized from sine waves and seeded noise by this project.

## Smallest useful prototype

Import a short audio file → arrange several tracks → make source-preserving edits → balance levels → save the session → render a WAV. Opt-in microphone capture adds a separate take, with honest browser/hardware limits. The first release avoids MIDI and pattern sequencing so it complements the FL-inspired app, and avoids specialized single-file restoration/editing so it complements Wave Room.

## Follow-on work, not current features

Real-device recorder tests and latency calibration; stronger large-project persistence; explicit loop ranges; track renaming/reordering/removal; robust pointer and touch test coverage; automated browser regression tests; offline support; input-level metering; safer large-file streaming. Any plug-in hosting or full DAW parity would be a different engineering project.
