from flask import Flask, render_template, request, jsonify
from ultralytics import YOLO
import cv2
import numpy as np
import base64

import torch
print(torch.__version__)

# from flask_cors import CORS

app = Flask(__name__)
# CORS(app)

# load model
model = YOLO("model/best.pt")

@app.route("/")
def index():
    return render_template("index.html")

@app.post("/detect_frame")
def detect_frame():
    if "frame" not in request.files:
        return jsonify({"error": "frame missing"}), 400

    # ===== Decode image =====
    file = request.files["frame"]
    img_bytes = file.read()
    img_array = np.frombuffer(img_bytes, np.uint8)
    frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

    if frame is None:
        return jsonify({"error": "invalid image"}), 400

    # ===== YOLO inference =====
    results = model(frame, conf=0.5)

    # Ambil frame dengan bounding box
    annotated_frame = results[0].plot()

    # ===== Encode ke base64 =====
    _, buffer = cv2.imencode(".jpg", annotated_frame)
    encoded_image = base64.b64encode(buffer).decode("utf-8")

    return jsonify({
        "image": encoded_image
    })

if __name__ == "__main__":
    app.run(debug=True)
