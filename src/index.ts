import Stats from "stats.js"
import { Effector } from "./Effector/Effector"
import { SupportedModels, createDetector } from "@tensorflow-models/hand-pose-detection"
const { MediaPipeHands } = SupportedModels

const stats = new Stats()
document.body.appendChild(stats.dom)

main()

async function main() {
  const detector = await createDetector(MediaPipeHands, {
    runtime: "mediapipe",
    solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1635986972/",
  })

  const effector = new Effector()
  await effector.prepare()

  const mainCanvas = document.createElement("canvas")
  const mainContext = mainCanvas.getContext("2d")!
  mainCanvas.style.height = "100vh"
  mainCanvas.style.width = "100vw"
  document.querySelector(".container")!.appendChild(mainCanvas)

  const cameraVideo = document.createElement("video");
  cameraVideo.addEventListener("playing", () => {
    const vw = cameraVideo.videoWidth
    const vh = cameraVideo.videoHeight
    mainCanvas.width = vw
    mainCanvas.height = vh
    mainCanvas.style.maxHeight = `calc(100vw * ${vh / vw})`
    mainCanvas.style.maxWidth = `calc(100vh * ${vw / vh})`
    cameraCanvas.width = vw
    cameraCanvas.height = vh
    maskCanvas.width = vw
    maskCanvas.height = vh
    prevMaskCanvas.width = vw
    prevMaskCanvas.height = vh
    effector.setSize(vw, vh)
    requestAnimationFrame(process)
  })
  const cameraCanvas = document.createElement("canvas")
  const cameraContext = cameraCanvas.getContext("2d")!

  const maskCanvas = document.createElement("canvas")
  const maskContext = maskCanvas.getContext("2d")!
  document.body.appendChild(maskCanvas)

  const prevMaskCanvas = document.createElement("canvas")
  const prevMaskContext = prevMaskCanvas.getContext("2d")!
  document.body.appendChild(prevMaskCanvas)

  if (navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: {
          ideal: 1280,
        },
        height: {
          ideal: 720,
        }
      },
    })
    .then(function (stream) {
      cameraVideo.srcObject = stream;
      cameraVideo.play();
      requestAnimationFrame(process)
    })
    .catch(function (e) {
      console.log(e)
      console.log("Something went wrong!");
    });
  } else {
    alert("getUserMedia not supported on your browser!");
  }

  async function process () {
    stats.begin()
    cameraContext.clearRect(0, 0, cameraCanvas.width, cameraCanvas.height)
    cameraContext.drawImage(cameraVideo, 0, 0, cameraCanvas.width, cameraCanvas.height)

    maskContext.filter = "blur(10px)"
    maskContext.clearRect(0, 0, maskCanvas.width, maskCanvas.height)
    maskContext.globalAlpha = 0.95
    maskContext.drawImage(prevMaskCanvas, 0, 0, maskCanvas.width, maskCanvas.height)
    maskContext.globalAlpha = 0.8

    const hands = await detector.estimateHands(cameraCanvas)
    hands.forEach(hand => {
      const keypoints = hand.keypoints
      const points = [keypoints[4], keypoints[8], keypoints[12], keypoints[16], keypoints[20]]
      points.forEach(point => {
        const { x, y } = point
        maskContext.fillStyle = "red"
        maskContext.beginPath();
        maskContext.arc(x, y, 30, 0, 2 * Math.PI);
        maskContext.closePath()
        maskContext.fill()
      })
    })

    prevMaskContext.clearRect(0, 0, maskCanvas.width, maskCanvas.height)
    prevMaskContext.globalAlpha = 1
    prevMaskContext.drawImage(maskCanvas, 0, 0, prevMaskCanvas.width, prevMaskCanvas.height)

    effector.process(cameraCanvas, maskCanvas)
    mainContext.drawImage(effector.getCanvas(), 0, 0, mainCanvas.width, mainCanvas.height)

    stats.end()
    requestAnimationFrame(process)
  }
}