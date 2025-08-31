# Screenshot Failure Diagnostic Reference (React Native + Expo Go)

This reference provides a **step-by-step diagnostic flow** for analysing why a screenshot (`captureRef`) failed.  
Each section contains **checklists** and **decision outcomes** for an IDE agent to follow.

---

## 0) Environment & API Sanity
- [ ] Confirm `react-native-view-shot` is installed and imported.
- [ ] Ensure no use of deprecated `takeSnapshotAsync`.
- [ ] Verify Expo Go supports `captureRef`.

**If fails:** Install/upgrade `react-native-view-shot`.

---

## 1) Target Ref Validity
- [ ] Ref is **non-null** at capture time.
- [ ] Ref points to a **native view** (`View`, `ScrollView`, etc.), not a custom component.

**If fails:** Forward ref to a native node.

---

## 2) Android Collapsable Optimisation
- [ ] Root container has `collapsable={false}` (Android only).

---

## 3) Layout & Size
- [ ] Layout reports **width > 0** and **height > 0**.
- [ ] Coordinates are **on-screen** (`x, y ≥ 0`).
- [ ] View is not hidden (`display:none`, `opacity:0`, etc.).

**If fails:** Give explicit size or ensure visible position.

---

## 4) Render Timing
- [ ] Capture delayed until after render.
- [ ] Wait **two `requestAnimationFrame`s** or use `InteractionManager.runAfterInteractions`.

---

## 5) Animations In Flight
- [ ] Confirm no active Reanimated/gesture animations on target subtree.
- [ ] Capture only after transitions finish.

---

## 6) Problematic Content
- [ ] Does view include `WebView`, `MapView`, `GLView`, `Video`, `Lottie`, `Skia`, or complex `Svg`?
  - [ ] If yes, use component-specific snapshot APIs (`MapView.takeSnapshot`, etc.)
  - [ ] Or provide static fallback representation.

---

## 7) Background & Transparency
- [ ] Captured root has a **solid `backgroundColor`** (avoid full transparency).

---

## 8) Android Hardware Acceleration
- [ ] Ensure hardware acceleration enabled.
- [ ] Use `renderToHardwareTextureAndroid` on container if needed.

---

## 9) Result Type & Persistence
- [ ] `captureRef` called with `result: 'tmpfile' | 'base64' | 'data-uri'`.
- [ ] Verify chosen result is correctly handled (e.g., log URI).

---

## 10) Media Library / Sharing
- [ ] If saving: request **MediaLibrary** permission.
- [ ] If sharing: check `Sharing.isAvailableAsync()` before calling.

---

## 11) Error Handling
- [ ] Wrap in `try/catch`.
- [ ] Log error with `console.warn('capture error', e)`.

---

## 12) Navigator / Modal / Z-Order
- [ ] Target is not occluded by modal/portal layers.
- [ ] If so, capture a **higher-level wrapper**.

---

## 13) ScrollView Full-Content
- [ ] If requirement = full content, not just visible viewport:
  - [ ] Temporarily expand height to content size.
  - [ ] Or render offscreen canvas export.

---

## 14) Version & Config Conflicts
- [ ] Verify RN/Expo/View-Shot versions are compatible.
- [ ] Clear Metro cache (`expo start -c`).

---

## 15) Minimal Repro Validation
- [ ] Create trivial `<View style={{width:200,height:120,backgroundColor:'#fff'}}><Text>Test</Text></View>`.
- [ ] Add `collapsable={false}`.
- [ ] Wait 2× RAF.
- [ ] Capture with `result:'tmpfile'` and log URI.

**If minimal fails:** Environment/API misconfiguration.  
**If minimal passes:** Reintroduce complexity step by step.

---

# Decision Outcomes
- ✅ **PASS:** URI produced → proceed to save/share integration.
- ⚠️ **PARTIAL:** Minimal repro works, complex case fails → reintroduce components one by one.
- ❌ **FAIL:** Minimal repro fails → fix environment/config first.

---

# Snippets for Automated Fixes

### Safe Capture Wrapper
```ts
async function safeCapture(ref: any, opts: any = {}) {
  if (!ref?.current) throw new Error('Ref is null');
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const { captureRef } = require('react-native-view-shot');
  return await captureRef(ref, { format: 'png', quality: 1, result: 'tmpfile', ...opts });
}