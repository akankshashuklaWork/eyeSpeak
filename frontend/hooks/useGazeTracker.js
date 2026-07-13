'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Bootstrap-only mapping used before calibration completes, so a rough
// cursor is visible while the user aims at the calibration targets. Once
// calibrate() runs, the fitted affine transform takes over.
const SENSITIVITY = 3.5;
const SMOOTHING = 0.2;

export function useGazeTracker() {
  const videoRef = useRef(null);
  const gazePointRef = useRef(null);
  const rawRatioRef = useRef({ x: 0.5, y: 0.5 });
  const calibrationRef = useRef(null);

  const [gazePoint, setGazePoint] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | tracking | unavailable
  const [calibrated, setCalibrated] = useState(false);

  useEffect(() => {
    let stream;
    let landmarker;
    let rafId;
    let cancelled = false;
    const smoothed = rawRatioRef.current;

    async function setup() {
      try {
        const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');

        const fileset = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );

        landmarker = await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          outputFaceBlendshapes: false,
          runningMode: 'VIDEO',
          numFaces: 1,
        });

        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        const video = videoRef.current;
        video.srcObject = stream;
        await video.play();

        setStatus('tracking');
        loop();
      } catch (err) {
        console.error('[gaze] tracker unavailable, falling back to click mode:', err);
        setStatus('unavailable');
      }
    }

    function loop() {
      if (cancelled) return;
      const video = videoRef.current;

      if (video && video.readyState >= 2) {
        const result = landmarker.detectForVideo(video, performance.now());
        const landmarks = result?.faceLandmarks?.[0];

        if (landmarks) {
          const raw = computeGazeRatio(landmarks);
          smoothed.x += (raw.x - smoothed.x) * SMOOTHING;
          smoothed.y += (raw.y - smoothed.y) * SMOOTHING;

          const point = calibrationRef.current
            ? clampPoint(applyAffine(calibrationRef.current, smoothed), window.innerWidth, window.innerHeight)
            : roughPoint(smoothed);

          gazePointRef.current = point;
          setGazePoint(point);
        }
      }

      rafId = requestAnimationFrame(loop);
    }

    setup();

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      landmarker?.close?.();
    };
  }, []);

  // Fits a 2D affine transform (least squares) from iris-ratio space to
  // screen pixels, given samples of { ratio: {x,y}, screen: {x,y} } collected
  // while the user looked at and clicked known on-screen points.
  const calibrate = useCallback((samples) => {
    if (!samples || samples.length < 3) return false;
    calibrationRef.current = fitAffine(samples);
    setCalibrated(true);
    return true;
  }, []);

  const resetCalibration = useCallback(() => {
    calibrationRef.current = null;
    setCalibrated(false);
  }, []);

  return { videoRef, gazePoint, gazePointRef, rawRatioRef, status, calibrated, calibrate, resetCalibration };
}

// Uses MediaPipe's refined face landmarks (iris points 468 and 473) relative
// to each eye's corners/eyelids to estimate a 0..1 horizontal/vertical gaze
// ratio, averaged across both eyes.
function computeGazeRatio(landmarks) {
  const rOuter = landmarks[33];
  const rInner = landmarks[133];
  const rTop = landmarks[159];
  const rBottom = landmarks[145];
  const rIris = landmarks[468];

  const lOuter = landmarks[263];
  const lInner = landmarks[362];
  const lTop = landmarks[386];
  const lBottom = landmarks[374];
  const lIris = landmarks[473];

  const rX = ratio(Math.min(rOuter.x, rInner.x), Math.max(rOuter.x, rInner.x), rIris.x);
  const rY = ratio(Math.min(rTop.y, rBottom.y), Math.max(rTop.y, rBottom.y), rIris.y);
  const lX = ratio(Math.min(lOuter.x, lInner.x), Math.max(lOuter.x, lInner.x), lIris.x);
  const lY = ratio(Math.min(lTop.y, lBottom.y), Math.max(lTop.y, lBottom.y), lIris.y);

  return {
    // Mirrored because the webcam feed is displayed mirrored for the user.
    x: 1 - (rX + lX) / 2,
    y: (rY + lY) / 2,
  };
}

function roughPoint(smoothed) {
  const dx = (smoothed.x - 0.5) * SENSITIVITY;
  const dy = (smoothed.y - 0.5) * SENSITIVITY;
  return {
    x: clamp((0.5 + dx) * window.innerWidth, 0, window.innerWidth),
    y: clamp((0.5 + dy) * window.innerHeight, 0, window.innerHeight),
  };
}

// Least-squares fit of screen.x = a*ratio.x + b*ratio.y + c (and same shape
// for screen.y with d,e,f) via the normal equations, solved with a small
// hand-rolled 3x3 Gaussian elimination — no linear-algebra dependency needed
// for a 3-unknown system.
function fitAffine(samples) {
  let Sxx = 0,
    Sxy = 0,
    Sx = 0,
    Syy = 0,
    Sy = 0;
  let SxTx = 0,
    SyTx = 0,
    STx = 0;
  let SxTy = 0,
    SyTy = 0,
    STy = 0;

  for (const s of samples) {
    const rx = s.ratio.x;
    const ry = s.ratio.y;
    Sxx += rx * rx;
    Sxy += rx * ry;
    Sx += rx;
    Syy += ry * ry;
    Sy += ry;
    SxTx += rx * s.screen.x;
    SyTx += ry * s.screen.x;
    STx += s.screen.x;
    SxTy += rx * s.screen.y;
    SyTy += ry * s.screen.y;
    STy += s.screen.y;
  }

  const n = samples.length;
  const A = [
    [Sxx, Sxy, Sx],
    [Sxy, Syy, Sy],
    [Sx, Sy, n],
  ];

  const [a, b, c] = solve3x3(A, [SxTx, SyTx, STx]);
  const [d, e, f] = solve3x3(A, [SxTy, SyTy, STy]);

  return { a, b, c, d, e, f };
}

function solve3x3(A, b) {
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < 3; col++) {
    let pivot = col;
    for (let row = col + 1; row < 3; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row;
    }
    [M[col], M[pivot]] = [M[pivot], M[col]];

    const div = M[col][col] || 1e-6;
    for (let k = col; k < 4; k++) M[col][k] /= div;

    for (let row = 0; row < 3; row++) {
      if (row === col) continue;
      const factor = M[row][col];
      for (let k = col; k < 4; k++) M[row][k] -= factor * M[col][k];
    }
  }

  return [M[0][3], M[1][3], M[2][3]];
}

function applyAffine(coeffs, ratio) {
  return {
    x: coeffs.a * ratio.x + coeffs.b * ratio.y + coeffs.c,
    y: coeffs.d * ratio.x + coeffs.e * ratio.y + coeffs.f,
  };
}

function clampPoint(point, maxX, maxY) {
  return { x: clamp(point.x, 0, maxX), y: clamp(point.y, 0, maxY) };
}

function ratio(min, max, value) {
  if (max === min) return 0.5;
  return (value - min) / (max - min);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
