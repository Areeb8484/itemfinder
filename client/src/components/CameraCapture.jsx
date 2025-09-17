import React, { useEffect, useRef, useState } from 'react';

/**
 * CameraCapture
 * Streams the user's camera using getUserMedia and allows capturing a single frame.
 * Props:
 *  - onCapture(dataUrl): called when a photo is captured
 *  - onError(err): optional, called if permission denied or other error
 *  - autoStart (default true): whether to immediately request camera
 */
const CameraCapture = ({ onCapture, onError, autoStart = true }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(autoStart);
  const [captured, setCaptured] = useState(null); // data URL
  const [initialRequestDone, setInitialRequestDone] = useState(false);

  useEffect(() => {
    if (!autoStart) return;
    startStream();
    return () => stopStream();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const startStream = async () => {
    if (streamRef.current) return; // already running
    setLoading(true);
    try {
      const constraints = {
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Some browsers require explicit play()
        const playPromise = videoRef.current.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {/* ignore */});
        }
      }
      setError(null);
    } catch (err) {
      console.error('Camera error', err);
      setError(err.message || 'Unable to access camera');
      if (onError) onError(err);
    } finally {
      setLoading(false);
      setInitialRequestDone(true);
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const capture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCaptured(dataUrl);
    stopStream(); // freeze after capture; retake will restart
    if (onCapture) onCapture(dataUrl);
  };

  const retake = () => {
    setCaptured(null);
    startStream();
  };

  // Basic styling (inline)
  const wrapperStyle = { border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: 12, background: 'rgba(255,255,255,0.04)' };
  const videoStyle = { width: '100%', borderRadius: 10, background: '#000', aspectRatio: '3 / 2', objectFit: 'cover' };
  const actionsStyle = { display: 'flex', gap: 10, marginTop: 12 };
  const btn = { flex: 1, padding: '10px 14px', borderRadius: 10, fontWeight: 600, cursor: 'pointer', border: 'none' };
  const primary = { ...btn, background: 'linear-gradient(90deg,#2563eb,#7e22ce)', color: '#fff' };
  const secondary = { ...btn, background: 'rgba(255,255,255,0.12)', color: '#fff' };
  const errorStyle = { color: '#f87171', fontSize: 14, marginTop: 8 };

  return (
    <div style={wrapperStyle}>
      {!captured && (
        <>
          <video ref={videoRef} playsInline muted style={videoStyle} />
          {loading && <div style={{ textAlign: 'center', fontSize: 14, opacity: 0.7, marginTop: 8 }}>Requesting camera…</div>}
          {error && (
            <div style={errorStyle}>
              {error.includes('secure') ? 'Camera requires HTTPS (or localhost). ' : ''}{error}
            </div>
          )}
          <div style={actionsStyle}>
            {!loading && !error && <button onClick={capture} style={primary}>Capture Photo</button>}
            {(!initialRequestDone || error) && !loading && (
              <button onClick={startStream} style={secondary}>Retry Camera</button>
            )}
          </div>
        </>
      )}
      {captured && (
        <>
          <img src={captured} alt="captured" style={{ width: '100%', borderRadius: 10, objectFit: 'cover' }} />
          <div style={actionsStyle}>
            <button onClick={retake} style={secondary}>Retake</button>
          </div>
        </>
      )}
    </div>
  );
};

export default CameraCapture;
