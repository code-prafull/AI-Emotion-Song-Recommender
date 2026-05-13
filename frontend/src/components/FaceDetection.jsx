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
        `http://localhost:3000/song?mood=${currentMood}`
      );

      setSongs(response.data.songs);

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

      const resized = faceapi.resizeResults(
        detections,
        displaySize
      );

      const ctx = canvasRef.current.getContext("2d");

      ctx.clearRect(0, 0, 500, 380);

      faceapi.draw.drawDetections(
        canvasRef.current,
        resized
      );

      faceapi.draw.drawFaceLandmarks(
        canvasRef.current,
        resized
      );

      faceapi.draw.drawFaceExpressions(
        canvasRef.current,
        resized
      );

      // detect mood
      if (detections.length > 0) {

        const expressions = detections[0].expressions;

        const maxExpression = Object.keys(expressions).reduce(
          (a, b) =>
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

    <div className="min-h-screen bg-zinc-950 flex justify-center items-center p-6">

      <div className="w-full max-w-6xl bg-zinc-900 rounded-3xl shadow-2xl p-6 flex flex-col lg:flex-row gap-8">

        {/* LEFT SIDE */}
        <div className="flex-1 flex flex-col items-center">

          <div className="relative rounded-3xl overflow-hidden border border-zinc-700 shadow-lg">

            <video
              ref={videoRef}
              autoPlay
              muted
              width="500"
              height="380"
              className="object-cover"
            />

            <canvas
              ref={canvasRef}
              width="500"
              height="380"
              className="absolute top-0 left-0"
            />

          </div>

          <div className="mt-5 w-full flex justify-between items-center">

            <div>

              <h1 className="text-white text-2xl font-bold">
                Current Mood
              </h1>

              <p className="text-zinc-400 text-lg capitalize">
                {mood || "Detecting..."}
              </p>

            </div>

            <button
              onClick={handleToggle}
              className={`px-6 py-3 rounded-2xl text-white font-semibold transition-all duration-300
              ${
                isDetecting
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-emerald-500 hover:bg-emerald-600"
              }`}
            >
              {
                isDetecting
                  ? "Stop Detection"
                  : "Start Detection"
              }
            </button>

          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="flex-1 bg-zinc-800 rounded-3xl p-5 overflow-y-auto max-h-[700px]">

          <h2 className="text-white text-3xl font-bold mb-5">
            Recommended Songs
          </h2>

          <Song songs={songs} />

        </div>

      </div>

    </div>
  );
};

export default FaceDetection;