import { useEffect, useRef, useState } from "react";
import {
    FilesetResolver,
    FaceLandmarker,
} from "@mediapipe/tasks-vision";

const FaceExpression = () => {
    const videoRef = useRef(null);
    const faceLandmarkerRef = useRef(null);
    const animationFrameRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [expression, setExpression] = useState("Detecting...");
    const [blendShapes, setBlendShapes] = useState([]);

    // Load MediaPipe model
    useEffect(() => {
        async function loadModel() {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
            );

            const faceLandmarker = await FaceLandmarker.createFromOptions(
                vision,
                {
                    baseOptions: {
                        modelAssetPath:
                            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
                    },

                    runningMode: "VIDEO",

                    numFaces: 1,

                    outputFaceBlendshapes: true,

                    outputFacialTransformationMatrixes: true,
                }
            );

            faceLandmarkerRef.current = faceLandmarker;

            setLoading(false);
        }

        loadModel();
    }, []);

    // Start webcam
    useEffect(() => {
        async function startCamera() {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        }

        startCamera();
    }, []);

    const detectExpression = () => {
        if (
            !videoRef.current ||
            videoRef.current.readyState !== 4 ||
            !faceLandmarkerRef.current
        ) {
            return;
        }

        const result = faceLandmarkerRef.current.detectForVideo(
            videoRef.current,
            performance.now()
        );

        if (
            result.faceBlendshapes &&
            result.faceBlendshapes.length > 0
        ) {
            const categories = result.faceBlendshapes[0].categories;

            setBlendShapes(categories);

            const data = {};

            categories.forEach((item) => {
                data[item.categoryName] = item.score;
            });


            /**
             * *name of the approach
             * ? Rule-Based Approach ⭐ (Sabse common) or Data-Driven Approach ⭐ or Configuration-Based Logic ⭐
             */

            const emotions = [
                {
                    name: "😂 Laughing",
                    check: () =>
                        data.mouthSmileLeft > 0.15 &&
                        data.mouthSmileRight > 0.15 &&
                        data.jawOpen > 0.39,
                },
                {
                    name: "😲 Surprised",
                    check: () =>
                        data.jawOpen > 0.025 &&
                        data.browInnerUp > 0.15,
                },
                {
                    name: "😨 Fear",
                    check: () =>
                        data.eyeWideLeft > 0.15 &&
                        data.eyeWideRight > 0.15 &&
                        data.jawOpen > 0.025,
                },
                {
                    name: "😡 angry",
                    check: () =>
                        data.browDownLeft > 0.025 ||
                        data.browDownRight > 0.025 &&
                        data.mouthPressLeft > 0.025 ||
                        data.mouthPressRight > 0.025

                },
                {
                    name: "😢 Sad",
                    check: () =>
                        data.browDownLeft > 0.3 &&
                        data.browDownRight > 0.3,
                },
                {
                    name: "🤢 Disgust",
                    check: () =>
                        data.noseSneerLeft > 0.30 ||
                        data.noseSneerRight > 0.30,
                },

                {
                    name: "😊 Happy",
                    check: () =>
                        data.mouthSmileLeft > 0.30 &&
                        data.mouthSmileRight > 0.30,
                },
                {
                    name: "😉 Left Wink",
                    check: () =>
                        data.eyeBlinkLeft > 0.45 &&
                        data.eyeBlinkRight < 0.20,
                },
                {
                    name: "😉 Right Wink",
                    check: () =>
                        data.eyeBlinkRight > 0.045 &&
                        data.eyeBlinkLeft < 0.020,
                },
                {
                    name: "😴 Eyes Closed",
                    check: () =>
                        data.eyeBlinkLeft > 0.60 &&
                        data.eyeBlinkRight > 0.60,
                },
                {
                    name: "😮 Mouth Open",
                    check: () =>
                        data.jawOpen > 0.45,
                },
            ];

            const detected = emotions.find((emotion) => emotion.check());

            setExpression(
                detected ? detected.name : "😐 Neutral"
            );
        } else {
            setExpression("No Face Detected");
        }
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "20px",
                padding: "20px",
            }}
        >
            <h1>MediaPipe Face Expression</h1>

            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                width={700}
                style={{
                    borderRadius: "10px",
                    border: "2px solid black",
                }}
            />

            <h2>{expression}</h2>

            <button onClick={detectExpression}>Detect Expressions</button>

            <div
                style={{
                    width: "700px",
                    maxHeight: "300px",
                    overflow: "auto",
                    border: "1px solid gray",
                    padding: "10px",
                }}
            >

                <h3>   Blend Shapes</h3>

                {blendShapes.map((item) => (
                    <div
                        key={item.categoryName}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                        }}
                    >
                        <span>{item.categoryName}</span>

                        <span>{item.score.toFixed(3)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FaceExpression;