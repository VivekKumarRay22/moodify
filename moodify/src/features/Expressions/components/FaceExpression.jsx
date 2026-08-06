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

    // Detect face continuously
    useEffect(() => {
        if (loading) return;

        const detect = () => {
            if (
                videoRef.current &&
                videoRef.current.readyState === 4 &&
                faceLandmarkerRef.current
            ) {
                const result = faceLandmarkerRef.current.detectForVideo(
                    videoRef.current,
                    performance.now()
                );

                if (
                    result.faceBlendshapes &&
                    result.faceBlendshapes.length > 0
                ) {
                    const categories =
                        result.faceBlendshapes[0].categories;

                    setBlendShapes(categories);

                    const data = {};

                    categories.forEach((item) => {
                        data[item.categoryName] = item.score;
                    });

                    let emotion = "😐 Neutral";

                    // Happy
                    if (
                        data.mouthSmileLeft > 0.6 &&
                        data.mouthSmileRight > 0.6
                    ) {
                        emotion = "😊 Happy";
                    }

                    // Laughing
                    else if (
                        data.mouthSmileLeft > 0.75 &&
                        data.mouthSmileRight > 0.75 &&
                        data.jawOpen > 0.35
                    ) {
                        emotion = "😂 Laughing";
                    }

                    // Surprised
                    else if (
                        data.jawOpen > 0.6 &&
                        data.browInnerUp > 0.55
                    ) {
                        emotion = "😲 Surprised";
                    }

                    // Sad
                    else if (
                        data.mouthFrownLeft > 0.45 &&
                        data.mouthFrownRight > 0.45
                    ) {
                        emotion = "😢 Sad";
                    }

                    // Angry
                    else if (
                        data.browDownLeft > 0.55 &&
                        data.browDownRight > 0.55 &&
                        data.mouthPressLeft > 0.25 &&
                        data.mouthPressRight > 0.25
                    ) {
                        emotion = "😠 Angry";
                    }

                    // Fear
                    else if (
                        data.eyeWideLeft > 0.5 &&
                        data.eyeWideRight > 0.5 &&
                        data.jawOpen > 0.4
                    ) {
                        emotion = "😨 Fear";
                    }

                    // Disgust
                    else if (
                        data.noseSneerLeft > 0.45 ||
                        data.noseSneerRight > 0.45
                    ) {
                        emotion = "🤢 Disgust";
                    }

                    // Wink Left
                    else if (
                        data.eyeBlinkLeft > 0.8 &&
                        data.eyeBlinkRight < 0.2
                    ) {
                        emotion = "😉 Left Wink";
                    }

                    // Wink Right
                    else if (
                        data.eyeBlinkRight > 0.8 &&
                        data.eyeBlinkLeft < 0.2
                    ) {
                        emotion = "😉 Right Wink";
                    }

                    // Both Eyes Closed
                    else if (
                        data.eyeBlinkLeft > 0.8 &&
                        data.eyeBlinkRight > 0.8
                    ) {
                        emotion = "😑 Eyes Closed";
                    }

                    // Mouth Open
                    else if (
                        data.jawOpen > 0.7
                    ) {
                        emotion = "😮 Mouth Open";
                    }

                    setExpression(emotion);
                } else {
                    setExpression("No Face Detected");
                }
            }

            animationFrameRef.current =
                requestAnimationFrame(detect);
        };

        detect();

        return () => {
            cancelAnimationFrame(animationFrameRef.current);
        };
    }, [loading]);

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

            <div
                style={{
                    width: "700px",
                    maxHeight: "300px",
                    overflow: "auto",
                    border: "1px solid gray",
                    padding: "10px",
                }}
            >
                <h3>Blend Shapes</h3>

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