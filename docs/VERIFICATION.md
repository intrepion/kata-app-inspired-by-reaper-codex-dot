# Verification

## Automated checks

Final result: **30 tests passed**, no failures or skipped tests. `npm run build` passed.

`npm run check` runs JavaScript syntax checks and Node tests. `npm run build` copies the static app into `dist/`.

The test suite covers:

- Session/track construction, end time, grid rounding, mute/solo rules.
- Nondestructive split, source alignment, boundary rejection, trim bounds, fade envelopes.
- WAV header/PCM layout, stereo interleaving, sample clamping.
- Project version, collection limits, finite settings, referential integrity, unique and HTML-safe identifiers, color/payload validation.
- Split edits with long fades remain valid for saving/reopening.
- Audio scheduling before/inside clips, fade-out resume, overlaps, stop/resume.
- Pending audio-context resume cancellation and repeated play requests.

Tests use fake audio nodes for scheduling assertions and a VM-only simulated DOM/MediaRecorder harness for startup failure cleanup, immediate stream release, recorded-source cropping, playback-time import bounds, and new-session memory release. They do not prove hardware audio output.

## Browser verification

Performed in the cloud Chrome browser on 2026-11-10 via the managed local preview at `http://127.0.0.1:4173/`. No file URLs used.

Verified:

- Built-in demo renders its four tracks/six clips and real source waveforms.
- Play advances the time display; pause preserves position; replay/Stop and return-to-start work.
- Split at the 0.625-second grid point, duplicate, delete, undo, and redo update clip counts and arrangement.
- Precision inspector fields preserve the 0.625/19.375 split without rounding the source beyond its end. Rename, numeric position/trim/fade edits apply successfully.
- Pointer drag moves a clip in time and onto another track; Undo restores it. Exact numeric trimming was tested; pointer trim handles were not separately exercised.
- Mute/solo toggle, track gain/pan and master sliders update their stored/displayed values.
- Add track and import a generated 1-second 440 Hz WAV via the real file chooser. The resulting clip shows the decoded length/source rate.
- Download `.trackstead`, replace the session by opening that actual downloaded file, and recover all four tracks/six clips and embedded sources. Editor controls stay enabled after async loading.
- Malformed project file is rejected while the existing session remains unchanged.
- New-session Cancel preserves work; Continue creates one empty track and clears history.
- Help opens/closes; timeline zoom switches to Wide. Track arm/disarm works without requesting microphone permission.
- No app-origin warning/error entries were observed. The environment's browser-extension metadata errors were separate from the app.

**Actual exported WAV inspected independently:** 882,000 frames, 20.000 seconds, two channels, 44,100 Hz, 16-bit PCM. Peak 0.381592, RMS 0.064745, 1,763,287 nonzero interleaved samples. No clipping. This verifies real non-silent render output, not merely a download button label.

Screenshots:
- `screenshots/trackstead-session.jpg`: full app arrangement, selected clip, inspector and mixer.
- `screenshots/trackstead-editing.jpg`: applied duration/fades and armed track. Arming is UI state only; no recording permission or microphone capture occurred.

Both screenshots are genuine 1165 × 997 browser captures. See `screenshots/provenance.json`. The preview was stopped after QA to release the shared local test server.

## Unverified and deliberately excluded

- Real microphone permission, device selection, recording hardware, background-tab capture behavior, and OS/browser input latency. No microphone permission was requested or granted during development.
- Audible output quality through physical speakers/headphones.
- Touch-device operation and cross-browser compatibility.
- The checks above describe the original local prototype QA. Public release verification is reported separately; the Tool Shed listing is maintained in its own repository.

## Privacy and provenance

QA uses built-in generated audio and a one-second locally generated 440 Hz test WAV. No personal audio, user microphone, external recordings, or proprietary assets are needed. Browser screenshots must be genuine local HTTP captures; no file URL or fabricated mockup is acceptable.
