import React, { useState, useRef, useEffect } from "react";
import { useSelector } from 'react-redux';
import { Button } from "@mui/material";
import { Camera, RefreshCw, Upload, Trash2, X } from 'lucide-react';

const resolveImageUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (
    !trimmed ||
    trimmed === "IMG" ||
    trimmed === "IMG.png" ||
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed === "-"
  ) {
    return null;
  }
  if (trimmed.startsWith("data:image/") || trimmed.startsWith("blob:")) {
    return trimmed;
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("Upload/") || trimmed.startsWith("/Upload/") || trimmed.includes("/")) {
    const clean = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
    return `https://bgstaging.bhima.gold/${clean}`;
  }
  return null;
};

const CameraComponent = ({ getImageUrl, capturedImage }) => {
  const { selectedCustomerID } = useSelector((state) => state.customer);
  const [currentImage, setCurrentImage] = useState(null);
  const [previousImage, setPreviousImage] = useState(null);
  const [initialImage, setInitialImage] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [cameraStream, setCameraStream] = useState(null);

  useEffect(() => {
    if (selectedCustomerID) {
      const allDocs = [
        ...(Array.isArray(selectedCustomerID.Documents) ? selectedCustomerID.Documents : []),
        ...(Array.isArray(selectedCustomerID.customerDocuments) ? selectedCustomerID.customerDocuments : []),
        ...(Array.isArray(selectedCustomerID.combinedDocuments) ? selectedCustomerID.combinedDocuments : []),
        ...(Array.isArray(selectedCustomerID.draftCustomerDocuments) ? selectedCustomerID.draftCustomerDocuments : []),
        ...(Array.isArray(selectedCustomerID.document) ? selectedCustomerID.document : []),
      ];

      const profileDoc = allDocs.find(
        (doc) =>
          doc.Type === "IMG" ||
          Number(doc.DocumentTypeID) === 30 ||
          Number(doc.documentTypeId) === 30
      );
      const rawImgUrl =
        selectedCustomerID.ImageURL ||
        selectedCustomerID.ImageUrl ||
        selectedCustomerID.Image ||
        profileDoc?.ImageURL ||
        profileDoc?.ImageUrl ||
        profileDoc?.ImagePath;

      const validUrl = resolveImageUrl(rawImgUrl);
      if (validUrl) {
        setInitialImage(validUrl);
        setCurrentImage(validUrl);
        setImageError(false);
        if (getImageUrl) getImageUrl(validUrl);
      }
    }
  }, [selectedCustomerID, getImageUrl]);

  // Show eKYC Aadhaar photo when capturedImage changes (from parent)
  useEffect(() => {
    if (capturedImage && (capturedImage.startsWith("data:image") || capturedImage.startsWith("http"))) {
      const validUrl = resolveImageUrl(capturedImage);
      if (validUrl) {
        if (currentImage && currentImage !== validUrl) {
          setPreviousImage(currentImage);
        }
        setCurrentImage(validUrl);
        setImageError(false);
        setIsCameraOpen(false);
      }
    }
  }, [capturedImage]);

  // Start camera
  const startCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera: ", error);
      alert("Unable to access camera. Please check browser permissions or use 'Upload Photo'.");
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
      if (videoRef.current) videoRef.current.srcObject = null;
    }
  };

  // Open Camera
  const handleCameraOpen = async () => {
    if (currentImage) {
      setPreviousImage(currentImage);
    }
    setIsCameraOpen(true);
    await startCamera();
  };

  const handleCancelCamera = () => {
    stopCamera();
    setIsCameraOpen(false);
  };

  const takePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const photoBase64 = canvas.toDataURL("image/jpeg", 0.85);
    if (currentImage && currentImage !== photoBase64) {
      setPreviousImage(currentImage);
    }
    setCurrentImage(photoBase64);
    setImageError(false);
    stopCamera();
    setIsCameraOpen(false);
    if (getImageUrl) getImageUrl(photoBase64);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      if (currentImage && currentImage !== base64) {
        setPreviousImage(currentImage);
      }
      setCurrentImage(base64);
      setImageError(false);
      stopCamera();
      setIsCameraOpen(false);
      if (getImageUrl) getImageUrl(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDelete = () => {
    if (previousImage && previousImage !== currentImage) {
      setCurrentImage(previousImage);
      setPreviousImage(null);
      setImageError(false);
      if (getImageUrl) getImageUrl(previousImage);
    } else if (initialImage && initialImage !== currentImage) {
      setCurrentImage(initialImage);
      setPreviousImage(null);
      setImageError(false);
      if (getImageUrl) getImageUrl(initialImage);
    } else {
      setCurrentImage(null);
      setPreviousImage(null);
      setImageError(false);
      if (getImageUrl) getImageUrl(null);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const hasValidDisplayImage = Boolean(currentImage && !imageError);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 animate-fade-in" style={{ padding: "10px" }}>
      {/* Hidden file input for photo upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: "none" }}
      />

      {/* === Camera Interface === */}
      {isCameraOpen && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{
              width: "100%",
              maxWidth: "400px",
              height: "350px",
              objectFit: "cover",
              border: "2px solid #CD9A50",
              borderRadius: "8px"
            }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", marginTop: "12px" }}>
            <Button
              onClick={takePhoto}
              style={{
                background: "linear-gradient(103.45deg, #614119 -11.68%, #CD9A50 48.54%, #614119 108.76%)",
                color: "white", display: "flex", alignItems: "center", gap: "8px", textTransform: "none", fontWeight: 600, padding: "8px 18px"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <Camera className="w-5 h-5" />
              Take Photo
            </Button>

            <Button
              onClick={handleCancelCamera}
              style={{
                background: "#666",
                color: "white", display: "flex", alignItems: "center", gap: "8px", textTransform: "none", fontWeight: 600, padding: "8px 16px"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <X className="w-5 h-5" />
              Cancel
            </Button>

            <Button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: "#444",
                color: "white", display: "flex", alignItems: "center", gap: "8px", textTransform: "none", fontWeight: 600, padding: "8px 16px"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <Upload className="w-5 h-5" />
              Upload File
            </Button>
          </div>
        </div>
      )}

      {/* === Photo Display & Actions (when camera is not streaming) === */}
      {!isCameraOpen && hasValidDisplayImage && (
        <div style={{ textAlign: "center", width: "100%" }}>
          <img
            src={currentImage}
            alt="Customer Profile"
            onError={() => {
              console.warn("Failed to load photo:", currentImage);
              setImageError(true);
            }}
            style={{
              width: "100%",
              maxWidth: "360px",
              maxHeight: "360px",
              objectFit: "contain",
              borderRadius: "8px",
              marginTop: "10px",
              border: "2px solid #CD9A50",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
            }}
          />

          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", marginTop: "14px" }}>
            <Button
              onClick={handleCameraOpen}
              style={{
                background: "linear-gradient(103.45deg, #614119 -11.68%, #CD9A50 48.54%, #614119 108.76%)",
                color: "white", display: "flex", alignItems: "center", gap: "8px", textTransform: "none", fontWeight: 600, padding: "8px 16px"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <RefreshCw className="w-5 h-5" />
              Retake / Edit Photo
            </Button>

            <Button
              onClick={() => fileInputRef.current?.click()}
              style={{
                background: "#555",
                color: "white", display: "flex", alignItems: "center", gap: "8px", textTransform: "none", fontWeight: 600, padding: "8px 16px"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <Upload className="w-5 h-5" />
              Upload Photo
            </Button>

            <Button
              onClick={handleDelete}
              style={{
                background: "#c62828",
                color: "white", display: "flex", alignItems: "center", gap: "8px", textTransform: "none", fontWeight: 600, padding: "8px 16px"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              <Trash2 className="w-5 h-5" />
              Delete Photo
            </Button>
          </div>
        </div>
      )}

      {/* === No valid image or broken image, and camera closed === */}
      {!isCameraOpen && !hasValidDisplayImage && (
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", marginTop: "10px" }}>
          <Button
            onClick={handleCameraOpen}
            style={{
              background: "linear-gradient(103.45deg, #614119 -11.68%, #CD9A50 48.54%, #614119 108.76%)",
              color: "white", display: "flex", alignItems: "center", gap: "8px", textTransform: "none", fontWeight: 600, padding: "8px 18px"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <Camera className="w-5 h-5" />
            Open Camera
          </Button>

          <Button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: "#555",
              color: "white", display: "flex", alignItems: "center", gap: "8px", textTransform: "none", fontWeight: 600, padding: "8px 16px"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <Upload className="w-5 h-5" />
            Upload Photo
          </Button>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default CameraComponent;
