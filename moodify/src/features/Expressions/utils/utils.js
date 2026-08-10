import {FilesetResolver,FaceLandmarker,} from "@mediapipe/tasks-vision";

export async function loadModel({
  faceLandmarkerRef,
}) {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
  );

  const faceLandmarker =
    await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task",
      },

      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: true,
      outputFacialTransformationMatrixes: true,
    });

  faceLandmarkerRef.current = faceLandmarker;
}

export async function startCamera(videoRef) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
  });

  if (videoRef.current) {
    videoRef.current.srcObject = stream;
  }

  return stream;
}