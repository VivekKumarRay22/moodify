import { useEffect, useRef, useState } from "react";

import {
    loadModel,
    startCamera,
    detectExpression,
    cleanupFaceDetection,
} from "../utils/utils";


const FaceExpression = () => {

    const videoRef = useRef(null);

    const faceLandmarkerRef = useRef(null);

    const animationFrameRef = useRef(null);


    const [loading, setLoading] = useState(true);

    const [expression, setExpression] = useState("Detecting...");

    const [blendShapes, setBlendShapes] = useState([]);


    // Load model and start camera
    useEffect(() => {

        async function setup() {

            try {

                setLoading(true);

                await loadModel({
                    faceLandmarkerRef,
                });

                await startCamera(
                    videoRef
                );

                setLoading(false);

            } catch (error) {

                console.error(
                    "Face detection setup failed:",
                    error
                );

                setLoading(false);
            }
        }


        setup();

    }, []);


    // Detect expression
    const handleDetectExpression = () => {

        if (
            !videoRef.current ||
            videoRef.current.readyState !== 4 ||
            !faceLandmarkerRef.current
        ) {
            return;
        }


        const result =
            faceLandmarkerRef.current.detectForVideo(
                videoRef.current,
                performance.now()
            );


        const detection =
            detectExpression(result);


        setExpression(
            detection.expression
        );


        setBlendShapes(
            detection.blendShapes
        );
    };


    // Cleanup
    useEffect(() => {

        return () => {

            cleanupFaceDetection({
                videoRef,
                faceLandmarkerRef,
                animationFrameRef,
            });

        };

    }, []);


    // Loading UI
    if (loading) {

        return (
            <main>
                <h1>
                    Loading Face Detection...
                </h1>
            </main>
        );
    }


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

            <h1>
                MediaPipe Face Expression
            </h1>


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


            <h2>
                {expression}
            </h2>


            <button
                onClick={handleDetectExpression}
            >
                Detect Expressions
            </button>


            <div
                style={{
                    width: "700px",
                    maxHeight: "300px",
                    overflow: "auto",
                    border: "1px solid gray",
                    padding: "10px",
                }}
            >

                <h3>
                    Blend Shapes
                </h3>


                {blendShapes.map((item) => (

                    <div
                        key={item.categoryName}
                        style={{
                            display: "flex",
                            justifyContent:
                                "space-between",
                        }}
                    >

                        <span>
                            {item.categoryName}
                        </span>


                        <span>
                            {item.score.toFixed(3)}
                        </span>

                    </div>

                ))}

            </div>

        </div>
    );
};


export default FaceExpression;