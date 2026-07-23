import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import axios from "axios";
import Song from "./Song";

const FaceDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  const [isDetecting, setIsDetecting] = useState(false);
  const [mood, setMood] = useState("");
  const [songs, setSongs] = useState([]);

  // webcam start
  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
      })
      .catch((err) => console.log(err));
  };

  // load face-api models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";

      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);

      startVideo();

      faceapi.matchDimensions(canvasRef.current, {
        width: 500,
        height: 380,
      });
    };

    loadModels();

    return () => clearInterval(intervalRef.current);
  }, []);

  // fetch songs
const fetchSongs = async (currentMood) => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_URL}/song?mood=${currentMood}`
    );

    setSongs(response.data.songs || []);
  } catch (err) {
    console.log(err);
  }
};

  // start detection
  const startDetection = () => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;

      const detections = await faceapi
        .detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceExpressions();

      const displaySize = {
        width: 500,
        height: 380,
      };

      const resized = faceapi.resizeResults(detections, displaySize);

      const ctx = canvasRef.current.getContext("2d");

      ctx.clearRect(0, 0, 500, 380);

      faceapi.draw.drawDetections(canvasRef.current, resized);

      faceapi.draw.drawFaceLandmarks(canvasRef.current, resized);

      faceapi.draw.drawFaceExpressions(canvasRef.current, resized);

      // detect mood
      if (detections.length > 0) {
        const expressions = detections[0].expressions;

        const maxExpression = Object.keys(expressions).reduce((a, b) =>
          expressions[a] > expressions[b] ? a : b
        );

        setMood(maxExpression);

        fetchSongs(maxExpression);
      }
    }, 2000);
  };

  // stop detection
  const stopDetection = () => {
    clearInterval(intervalRef.current);

    intervalRef.current = null;

    const ctx = canvasRef.current.getContext("2d");

    ctx.clearRect(0, 0, 500, 380);
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
            <div className="relative rounded-2xl overflow-hidden border border-zinc-700/80 shadow-2xl bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                width="500"
                height="380"
                className="object-cover transform scale-x-[-1]"
              />

              <canvas
                ref={canvasRef}
                width="500"
                height="380"
                className="absolute top-0 left-0 transform scale-x-[-1]"
              />

              {/* Overlay Scanner effect when active */}
              {isDetecting && (
                <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-2xl pointer-events-none animate-pulse" />
              )}
            </div>
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
              className={`w-full sm:w-auto px-6 py-3 rounded-xl text-white font-semibold transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${
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

          <div className="mt-4">
            <Song songs={songs} />
          </div>
        </div>

      </div>
    </div>
  );
};

FaceDetection;
export default FaceDetection;