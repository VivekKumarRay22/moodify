import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision"

// Load MediaPipe model
export async function loadModel({ faceLandmarkerRef }) {
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
}

// Start webcam
export async function startCamera(videoRef) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
  })

  if (videoRef.current) {
    videoRef.current.srcObject = stream
  }
}

// Detect expression
export function detectExpression(result) {
  if (!result.faceBlendshapes || result.faceBlendshapes.length === 0) {
    return {
      expression: "No Face Detected",
      blendShapes: [],
    }
  }

  const categories = result.faceBlendshapes[0].categories

  const data = {}

  categories.forEach((item) => {
    data[item.categoryName] = item.score
  })

  /**
   * Rule-Based Approach
   *
   * MediaPipe gives us blendshape scores.
   * We use those scores to determine the expression.
   */

  const emotions = [
    {
      name: "😴 Eyes Closed",
      check: () => data.eyeBlinkLeft > 0.6 && data.eyeBlinkRight > 0.6,
    },

    {
      name: "😉 Left Wink",
      check: () => data.eyeBlinkLeft > 0.35 && data.eyeBlinkRight < 0.2,
    },

    {
      name: "😉 Right Wink",
      check: () => data.eyeBlinkRight > 0.35 && data.eyeBlinkLeft < 0.2,
    },

    {
      name: "😂 Laughing",
      check: () =>
        (data.mouthSmileLeft > 0.15 || data.mouthSmileRight > 0.15) &&
        data.jawOpen > 0.39,
    },

    {
      name: "😲 Surprised",
      check: () =>
        data.jawOpen > 0.025 &&
        data.browInnerUp > 0.15 &&
        (data.browOuterUpRight > 0.3 || data.browOuterUpLeft > 0.3),
    },

    {
      name: "😨 Fear",
      check: () =>
        (data.eyeWideLeft > 0.15 || data.eyeWideRight > 0.15) &&
        data.browInnerUp > 0.15 &&
        (data.browOuterUpRight > 0.3 || data.browOuterUpLeft > 0.3) &&
        (data.eyeLookDownLeft > 0.3 || data.eyeLookDownRight > 0.3),
    },

    {
      name: "😢 Sad",
      check: () =>
        (data.browDownLeft > 0.3 || data.browDownRight > 0.3) &&
        (data.mouthFrownLeft > 0.03 || data.mouthFrownRight > 0.03) &&
        (data.mouthPressLeft > 0.025 || data.mouthPressRight > 0.025),
    },

    {
      name: "😡 Angry",
      check: () =>
        (data.browDownLeft > 0.025 || data.browDownRight > 0.025) &&
        (data.mouthPressLeft > 0.025 || data.mouthPressRight > 0.025) &&
        (data.eyeSquintRight > 0.025 || data.eyeSquintLeft > 0.025),
    },

    {
      name: "😊 Happy",
      check: () =>
        data.mouthSmileLeft > 0.3 &&
        data.mouthSmileRight > 0.3 &&
        data.jawOpen < 0.0039,
    },

    {
      name: "😮 Mouth Open",
      check: () => data.jawOpen > 0.45,
    },
  ]

  const detected = emotions.find((emotion) => emotion.check())

  return {
    expression: detected ? detected.name : "😐 Neutral",

    blendShapes: categories,
  }
}

// Cleanup
export function cleanupFaceDetection({
  videoRef,
  faceLandmarkerRef,
  animationFrameRef,
}) {
  cancelAnimationFrame(animationFrameRef.current)

  if (videoRef.current?.srcObject) {
    const tracks = videoRef.current.srcObject.getTracks()

    tracks.forEach((track) => {
      track.stop()
    })

    videoRef.current.srcObject = null
  }

  if (faceLandmarkerRef.current) {
    faceLandmarkerRef.current.close()
    faceLandmarkerRef.current = null
  }
}
