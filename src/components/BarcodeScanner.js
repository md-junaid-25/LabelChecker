import React, { useEffect, useRef, useState, useCallback } from 'react';
import Quagga from '@ericblade/quagga2';

// ── Icons ─────────────────────────────────────────────────────────────────
const CameraIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const ImageIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const FlipIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15"/>
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────
function getMedianOfArray(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function validateBarcode(result) {
  if (!result || !result.codeResult) return false;
  const errors = result.codeResult.decodedCodes
    .filter(x => x.error !== undefined)
    .map(x => x.error);
  return errors.length === 0 || getMedianOfArray(errors) < 0.25;
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function BarcodeScanner({ onDetected, onClose }) {
  const [mode, setMode]               = useState('choose');
  const [cameras, setCameras]         = useState([]);
  const [camIndex, setCamIndex]       = useState(0);
  const [scanning, setScanning]       = useState(false);
  const [error, setError]             = useState(null);
  const [flashActive, setFlashActive] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageResult, setImageResult]   = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  const videoContainerRef = useRef(null);
  const fileRef           = useRef(null);
  const quaggaRunning     = useRef(false);
  const detectedRef       = useRef(false);

  // ── Stop Quagga ─────────────────────────────────────────────────────────
  const stopQuagga = useCallback(() => {
    if (quaggaRunning.current) {
      try { Quagga.stop(); } catch {}
      quaggaRunning.current = false;
    }
    setScanning(false);
  }, []);

  // ── Start camera scan ────────────────────────────────────────────────────
  const startCamera = useCallback(async (deviceId) => {
    setError(null);
    detectedRef.current = false;

    // Get available cameras first
    let devices = cameras;
    if (devices.length === 0) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        devices = allDevices.filter(d => d.kind === 'videoinput');
        setCameras(devices);
      } catch (e) {
        if (e.name === 'NotAllowedError') {
          setError('Camera permission denied. Please allow camera access in your browser settings and try again.');
        } else {
          setError(`Could not access camera: ${e.message}`);
        }
        return;
      }
    }

    const selectedId = deviceId || devices[camIndex]?.deviceId || undefined;

    // Wait for DOM to mount
    await new Promise(r => setTimeout(r, 100));

    try {
      await new Promise((resolve, reject) => {
        Quagga.init({
          inputStream: {
            type: 'LiveStream',
            target: videoContainerRef.current,
            constraints: {
              deviceId: selectedId ? { exact: selectedId } : undefined,
              facingMode: selectedId ? undefined : 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            area: {
              top:    '15%',
              right:  '10%',
              bottom: '15%',
              left:   '10%',
            },
          },
          locator: {
            patchSize: 'medium',
            halfSample: true,
          },
          numOfWorkers: 2,
          frequency: 10,
          decoder: {
            readers: [
              'ean_reader',
              'ean_8_reader',
              'upc_reader',
              'upc_e_reader',
              'code_128_reader',
              'code_39_reader',
            ],
          },
          locate: true,
        }, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      Quagga.start();
      quaggaRunning.current = true;
      setScanning(true);

      Quagga.onDetected((result) => {
        if (detectedRef.current) return;
        if (!validateBarcode(result)) return;
        const code = result.codeResult.code;
        if (!code || code.length < 6) return;

        detectedRef.current = true;
        setFlashActive(true);
        setTimeout(() => setFlashActive(false), 600);
        stopQuagga();
        setTimeout(() => onDetected(code), 200);
      });

    } catch (e) {
      setScanning(false);
      if (e.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (e.name === 'NotFoundError') {
        setError('No camera found on this device.');
      } else {
        setError(`Camera error: ${e.message || 'Could not start camera.'}`);
      }
    }
  }, [camIndex, cameras, onDetected, stopQuagga]);

  // ── Flip camera ──────────────────────────────────────────────────────────
  const flipCamera = useCallback(() => {
    stopQuagga();
    const next = (camIndex + 1) % Math.max(cameras.length, 1);
    setCamIndex(next);
    setTimeout(() => startCamera(cameras[next]?.deviceId), 400);
  }, [camIndex, cameras, startCamera, stopQuagga]);

  // ── Image file scan ──────────────────────────────────────────────────────
  const handleImageFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setError(null);
    setImageResult(null);
    setImageLoading(true);

    const url = URL.createObjectURL(file);
    setImagePreview(url);

    Quagga.decodeSingle(
      {
        decoder: {
          readers: [
            'ean_reader',
            'ean_8_reader',
            'upc_reader',
            'upc_e_reader',
            'code_128_reader',
            'code_39_reader',
          ],
        },
        locate: true,
        src: url,
      },
      (result) => {
        setImageLoading(false);
        if (result && result.codeResult) {
          const code = result.codeResult.code;
          setImageResult(code);
          setTimeout(() => onDetected(code), 900);
        } else {
          setError('No barcode found in this image. Try a clearer, well-lit photo with the barcode fully visible and unobstructed.');
        }
      }
    );
  }, [onDetected]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleImageFile(file);
  }, [handleImageFile]);

  // ── Lifecycle ────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => stopQuagga();
  }, [stopQuagga]);

  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    } else {
      stopQuagga();
    }
  }, [mode]); // eslint-disable-line

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="scanner-overlay" onClick={(e) => { if (e.target === e.currentTarget) { stopQuagga(); onClose(); } }}>
      <div className="scanner-modal">

        {/* Header */}
        <div className="scanner-header">
          <div className="scanner-title">
            {mode === 'choose' && '📷 Scan Barcode'}
            {mode === 'camera' && '📷 Camera Scanner'}
            {mode === 'image'  && '🖼️ Image Scanner'}
          </div>
          <button className="scanner-close" onClick={() => { stopQuagga(); onClose(); }}>
            <CloseIcon />
          </button>
        </div>

        {/* ── Choose mode ── */}
        {mode === 'choose' && (
          <div className="scanner-choose">
            <p className="scanner-choose-sub">Choose how to scan your barcode</p>
            <div className="scanner-options">
              <button className="scanner-option-btn" onClick={() => setMode('camera')}>
                <div className="sob-icon"><CameraIcon /></div>
                <div className="sob-label">Use Camera</div>
                <div className="sob-sub">Live scan from your device camera</div>
              </button>
              <button className="scanner-option-btn" onClick={() => setMode('image')}>
                <div className="sob-icon"><ImageIcon /></div>
                <div className="sob-label">Upload Image</div>
                <div className="sob-sub">Scan barcode from a photo or screenshot</div>
              </button>
            </div>
          </div>
        )}

        {/* ── Camera mode ── */}
        {mode === 'camera' && (
          <div className="scanner-camera">
            <div className={`video-wrap ${flashActive ? 'flash' : ''}`}>
              {/* Quagga renders the video+canvas into this div */}
              <div ref={videoContainerRef} className="quagga-container" />

              {/* Viewfinder overlay */}
              <div className="viewfinder" style={{ pointerEvents: 'none' }}>
                <div className="vf-corner tl" />
                <div className="vf-corner tr" />
                <div className="vf-corner bl" />
                <div className="vf-corner br" />
                {scanning && <div className="vf-scanline" />}
              </div>

              {scanning && <div className="scanning-badge">Scanning…</div>}
              {!scanning && !error && <div className="scanning-badge" style={{ background: 'rgba(255,184,48,0.7)' }}>Starting camera…</div>}
            </div>

            {error && <div className="scanner-error">{error}</div>}

            <div className="scanner-controls">
              {cameras.length > 1 && (
                <button className="scan-ctrl-btn outline" onClick={flipCamera}>
                  <FlipIcon /> Flip Camera
                </button>
              )}
              <button className="scan-ctrl-btn secondary" onClick={() => { stopQuagga(); setMode('choose'); }}>
                ← Back
              </button>
            </div>
            <p className="scanner-hint">Point camera at the barcode. Keep it steady and well-lit.</p>
          </div>
        )}

        {/* ── Image mode ── */}
        {mode === 'image' && (
          <div className="scanner-image">
            {!imagePreview ? (
              <div
                className="drop-zone"
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current?.click()}
              >
                <div className="dz-icon">🖼️</div>
                <div className="dz-title">Drop image here or click to browse</div>
                <div className="dz-sub">JPG, PNG, WebP · Barcode must be clearly visible</div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => handleImageFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="image-preview-wrap">
                <img src={imagePreview} alt="Scan target" className="image-preview" />
                {imageLoading && (
                  <div className="image-scanning-overlay">
                    <div className="img-scan-spinner" />
                    <div>Reading barcode…</div>
                  </div>
                )}
                {imageResult && (
                  <div className="image-success">
                    ✅ Found: <strong>{imageResult}</strong> — loading product…
                  </div>
                )}
              </div>
            )}

            {error && <div className="scanner-error">{error}</div>}

            <div className="scanner-controls">
              {imagePreview && (
                <button
                  className="scan-ctrl-btn"
                  onClick={() => { setImagePreview(null); setImageResult(null); setError(null); fileRef.current?.click(); }}
                >
                  Try Another Image
                </button>
              )}
              <button
                className="scan-ctrl-btn secondary"
                onClick={() => { setMode('choose'); setImagePreview(null); setImageResult(null); setError(null); }}
              >
                ← Back
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
