import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision"

// Load MediaPipe model

  export async function loadModel({ animationFrameRef, faceLandmarkerRef, videoRef }) {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm",
    )

    const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
      },

      runningMode: "VIDEO",

      numFaces: 1,

      outputFaceBlendshapes: true,

      outputFacialTransformationMatrixes: true,
    })

    faceLandmarkerRef.current = faceLandmarker

    setLoading(false)
  }

  loadModel()


// Start webcam

  export async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    })

    if (videoRef.current) {
      videoRef.current.srcObject = stream
    }
  }

  startCamera()

