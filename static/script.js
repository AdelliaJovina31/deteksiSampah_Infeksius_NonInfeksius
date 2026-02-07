// ======== AKSES KAMERA ========
const cameraBtn = document.getElementById("cameraBtn");
const cameraContainer = document.getElementById("cameraContainer");
const cameraFeed = document.getElementById("cameraFeed");
const cameraIcon = document.getElementById("cameraIcon");

let webcamStream = null;
let isRunning = false;

cameraBtn.addEventListener("click", async () => {
    try {
        // Coba kamera belakang dulu
        webcamStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { exact: "environment" } }
        });
        console.log("Kamera belakang digunakan");
    } catch (err) {
        console.warn("Kamera belakang tidak tersedia, kamera depan diaktifkan");

        // Jika gagal, pakai kamera depan
        webcamStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" }
        });
    }

    const video = document.createElement("video");
    video.srcObject = webcamStream;

    video.onloadedmetadata = () => {
        video.play();
        startWebcamDetection(video);
    };

    cameraContainer.classList.remove("d-none");
    cameraIcon.classList.add("d-none");
    cameraBtn.classList.add("d-none");

});

async function startWebcamDetection(video) {
    isRunning = true;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    async function loop() {
        if (!isRunning) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        canvas.toBlob(async (blob) => {
            // berhenti saat kamera dimatikan
            if (!isRunning || !blob) return;

            const formData = new FormData();
            formData.append("frame", blob, "frame.jpg");

            try {
                const response = await fetch("/detect_frame", {
                    method: "POST",
                    body: formData
                });
                const data = await response.json();

                cameraFeed.src = "data:image/jpeg;base64," + data.image;

                // if (isRunning && data.recommendations.length > 0) {
                //     recommendation.innerHTML = `
                //         <div class="mt-3 text-start" style="max-width: 500px; margin: 0 auto;">
                //             <h5 class="fw-bold mt-3">Rekomendasi Aksi (Real-Time): </h5>\
                //             <ul>
                //                 ${data.recommendations.map(r => `<li>${r}</li>`).join("")}
                //             </ul>
                //         </div>
                //     `;
                //     recommendation.classList.remove("d-none");
                // }
            } catch (err) {
                console.error(err);
            }

            if (isRunning) requestAnimationFrame(loop);
        }, "image/jpeg");

    }

    loop();
}

function stopCamera() {
    isRunning = false;

    if (webcamStream) {
        webcamStream.getTracks().forEach(t => t.stop());
    }

    cameraFeed.src = "";
    cameraContainer.classList.add("d-none");
    cameraIcon.classList.remove("d-none");
    cameraBtn.classList.remove("d-none");
}