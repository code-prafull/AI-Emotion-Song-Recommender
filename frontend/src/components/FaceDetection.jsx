import { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import axios from "axios";
import Song from "./Song";

const MODEL_URL = "/models";

// API base without trailing slash. If this is empty the app shows an error
// instead of silently calling "undefined/song?mood=...".
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const SMOOTHING_FRAMES = 5; // average expressions over the last N frames
const MIN_STABLE_FRAMES = 3; // wait for stable expression before fetching
const DETECT_INTERVAL_MS = 1200;

const FaceDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const busyRef = useRef(false); // prevents overlapping detections
  const historyRef = useRef([]); // expression history for smoothing
  const detectorRef = useRef("ssd"); // "ssd" (accurate) or "tiny" (fallback)
  const lastFetchedMoodRef = useRef(null);

  const [isDetecting, setIsDetecting] = useState(false);
  const [modelsReady, setModelsReady] = useState(false);
  const [mood, setMood] = useState("");
  const [songs, setSongs] = useState([]);
  const [apiError, setApiError] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [modelError, setModelError] = useState("");

  // load face-api models + start webcam
  useEffect(() => {
    let stream = null;
    let cancelled = false;

    const loadModels = async () => {
      try {
        // SSD MobileNetV1 is far more accurate than the tiny detector.
        // Its weights are already shipped in public/models.
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        detectorRef.current = "ssd";
      } catch (ssdError) {
        console.error("SSD model failed to load, falling back to tiny detector", ssdError);
        try {
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
          ]);
          detectorRef.current = "tiny";
        } catch (err) {
          if (!cancelled) setModelError(`Could not load face detection models (${err.message}). Check your connection and reload.`);
          return;
        }
      }
      if (!cancelled) setModelsReady(true);
    };

    const startVideo = async () => {
      try {
        // getUserMedia only works in secure contexts (https:// or localhost)
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraError("Camera is only available over HTTPS. Open the site via https:// to use the webcam.");
          return;
        }
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        setCameraError(
          err.name === "NotAllowedError"
            ? "Camera permission denied. Allow camera access in your browser and try again."
            : `Camera error: ${err.message}`
        );
      }
    };

    loadModels();
    startVideo();

    return () => {
      cancelled = true;
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // fetch songs: try mood filter first, fall back to all songs
  const fetchSongs = async (expression) => {
    if (!API_BASE) {
      setApiError("VITE_API_URL is not set. Add it to the frontend build environment and redeploy.");
      return;
    }

    const tryMoods = expression && expression !== "neutral" ? [expression, ""] : [""];

    for (const m of tryMoods) {
      try {
        const url = m
          ? `${API_BASE}/song?mood=${encodeURIComponent(m)}`
          : `${API_BASE}/song`;
        const response = await axios.get(url, { timeout: 8000 });
        const list = (response.data && response.data.songs) || [];
        if (list.length > 0) {
          setSongs(list);
          setApiError("");
          return;
        }
      } catch (err) {
        setApiError(`Cannot reach the API at ${API_BASE} (${err.message})`);
        return;
      }
    }

    // API answered but has no songs for this mood (or at all)
    setSongs([]);
    setApiError("");
  };

  // one detection tick
  const detectionTick = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || busyRef.current) return;

    busyRef.current = true;
    try {
      const detectorOptions =
        detectorRef.current === "ssd"
          ? new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 })
          : new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 });

      const detections = await faceapi
        .detectAllFaces(video, detectorOptions)
        .withFaceLandmarks()
        .withFaceExpressions();

      // Size the canvas to the *actual* rendered video box so boxes/landmarks
      // line up exactly (no object-cover crop mismatch).
      const displaySize = { width: video.clientWidth, height: video.clientHeight };

      if (displaySize.width && displaySize.height) {
        faceapi.matchDimensions(canvas, displaySize);
        const resized = faceapi.resizeResults(detections, displaySize);

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        faceapi.draw.drawDetections(canvas, resized);
        faceapi.draw.drawFaceLandmarks(canvas, resized);
        faceapi.draw.drawFaceExpressions(canvas, resized);
      }

      if (detections.length > 0) {
        const history = historyRef.current;
        history.push(detections[0].expressions);
        if (history.length > SMOOTHING_FRAMES) history.shift();

        // average scores over the last frames so a single noisy frame
        // doesn't flip the mood
        const keys = Object.keys(history[0]);
        const avg = {};
        keys.forEach((k) => {
          avg[k] = history.reduce((sum, e) => sum + e[k], 0) / history.length;
        });

        const dominant = keys.reduce((a, b) => (avg[a] > avg[b] ? a : b));
        setMood(dominant);

        if (history.length >= MIN_STABLE_FRAMES && dominant !== lastFetchedMoodRef.current) {
          lastFetchedMoodRef.current = dominant;
          fetchSongs(dominant);
        }
      }
    } catch (err) {
      console.error("detection failed", err);
    } finally {
      busyRef.current = false;
    }
  };

  // start detection
  const startDetection = () => {
    if (intervalRef.current) return;
    if (videoRef.current && videoRef.current.play) videoRef.current.play().catch(() => {});
    detectionTick();
    intervalRef.current = setInterval(detectionTick, DETECT_INTERVAL_MS);
  };

  // stop detection
  const stopDetection = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    historyRef.current = [];
    lastFetchedMoodRef.current = null;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // toggle
  const handleToggle = () => {
    if (isDetecting) {
      stopDetection();
    } else {
      startDetection();
    }
    setIsDetecting(!isDetecting);
  };

  const cameraIssue = modelError || cameraError;

  return (
    <div className="min-h-screen bg-[#09090b] flex justify-center items-center p-4 md:p-8">
      <div className="w-full max-w-7xl bg-[#121214] border border-zinc-800/80 rounded-3xl shadow-2xl p-6 md:p-8 flex flex-col lg:flex-row gap-8 backdrop-blur-xl">

        {/* LEFT SIDE: WEBCAM & MOOD MONITOR */}
        <div className="flex-1 flex flex-col items-center justify-between">
          <div className="w-full flex flex-col items-center">

            {/* Header info */}
            <div className="w-full mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-white text-lg font-semibold tracking-wide">AI Vision Camera</h2>
              </div>
              <span className="text-xs text-zinc-400 bg-zinc-800/60 px-3 py-1 rounded-full border border-zinc-700/50">
                Face-API.js
              </span>
            </div>

            {/* Video Container */}
            <div className="relative w-full max-w-[500px] rounded-2xl overflow-hidden border border-zinc-700/80 shadow-2xl bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                width="500"
                height="380"
                className="block w-full h-auto transform scale-x-[-1]"
              />

              <canvas
                ref={canvasRef}
                className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]"
              />

              {/* Overlay Scanner effect when active */}
              {isDetecting && !cameraIssue && (
                <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-2xl pointer-events-none animate-pulse" />
              )}
            </div>

            {/* Errors / status under the video */}
            {cameraIssue ? (
              <div className="mt-3 w-full max-w-[500px] bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl">
                {cameraIssue}
              </div>
            ) : !modelsReady ? (
              <p className="mt-3 text-zinc-400 text-xs">Loading face detection models...</p>
            ) : null}
          </div>

          {/* Bottom Control & Mood Panel */}
          <div className="mt-6 w-full bg-zinc-900/80 border border-zinc-800/80 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-inner">
            <div>
              <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Detected Expression</p>
              <h1 className="text-white text-2xl font-bold capitalize mt-0.5 tracking-tight flex items-center gap-2">
                {mood ? (
                  <span className="text-emerald-400">{mood}</span>
                ) : (
                  <span className="text-zinc-500 italic">Waiting...</span>
                )}
              </h1>
            </div>

            <button
              onClick={handleToggle}
              disabled={!modelsReady || !!cameraIssue}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl text-white font-semibold transition-all duration-300 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                isDetecting
                  ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white"
                  : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-bold"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isDetecting ? "bg-red-400 animate-ping" : "bg-zinc-950"}`} />
              {isDetecting ? "Stop Detection" : "Start Detection"}
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: SONG PLAYLIST */}
        <div className="flex-1 bg-[#18181b] border border-zinc-800/80 rounded-3xl p-6 overflow-y-auto max-h-[750px] shadow-inner custom-scrollbar">
          <div className="sticky top-0 bg-[#18181b]/95 backdrop-blur-md pb-4 mb-2 border-b border-zinc-800 z-10">
            <h2 className="text-white text-2xl font-bold tracking-tight">
              Recommended Playlist
            </h2>
            <p className="text-zinc-400 text-xs mt-0.5">Curated dynamically based on your facial expressions</p>
          </div>

          {apiError && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl">
              {apiError}
            </div>
          )}

          <div className="mt-4">
            <Song songs={songs} />
          </div>
        </div>

      </div>
    </div>
  );
};

export default FaceDetection;
