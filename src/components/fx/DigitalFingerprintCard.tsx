import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Download, QrCode } from "lucide-react";
import { downloadBlob } from "@/lib/fx/images";

export interface FingerprintImage {
  id: string;
  name: string;
  mime_type: string | null;
  file_size: number;
  sha256: string;
  width: number | null;
  height: number | null;
  created_at: string;
}

export default function DigitalFingerprintCard({
  image,
  onCopy,
  onDownload,
}: {
  image: FingerprintImage;
  onCopy: () => void;
  onDownload: () => void;
}) {
  const [qr, setQr] = useState("");
  useEffect(() => {
    const url = new URL(
      `/verify?id=${encodeURIComponent(image.id)}`,
      window.location.origin,
    ).toString();
    QRCode.toDataURL(url, { width: 176, margin: 1, color: { dark: "#36415A", light: "#FFFFFF" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, [image.id]);
  const downloadCard = () => {
    const data = {
      imageSealId: image.id,
      filename: image.name,
      sha256: image.sha256,
      dimensions: image.width && image.height ? `${image.width} × ${image.height}` : null,
      format: image.mime_type || image.name.split(".").at(-1)?.toUpperCase() || "unknown",
      fileSizeBytes: image.file_size,
      uploadedAt: image.created_at,
      verificationUrl: new URL(
        `/verify?id=${encodeURIComponent(image.id)}`,
        window.location.origin,
      ).toString(),
    };
    downloadBlob(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
      `imageseal-${image.id}-fingerprint.json`,
    );
  };
  return (
    <section className="fingerprint-card">
      <div className="fingerprint-card-header">
        <div>
          <p className="eyebrow">DIGITAL FINGERPRINT</p>
          <h3>Image identity card</h3>
        </div>
        <span className="fingerprint-seal">SEALED</span>
      </div>
      <dl className="fingerprint-grid">
        <div>
          <dt>Unique image ID</dt>
          <dd>{image.id}</dd>
        </div>
        <div>
          <dt>Filename</dt>
          <dd title={image.name}>{image.name}</dd>
        </div>
        <div>
          <dt>Dimensions</dt>
          <dd>
            {image.width && image.height ? `${image.width} × ${image.height}px` : "Unavailable"}
          </dd>
        </div>
        <div>
          <dt>File format</dt>
          <dd>{image.mime_type || image.name.split(".").at(-1)?.toUpperCase() || "Unknown"}</dd>
        </div>
        <div>
          <dt>File size</dt>
          <dd>{image.file_size.toLocaleString()} bytes</dd>
        </div>
        <div>
          <dt>Uploaded</dt>
          <dd>{new Date(image.created_at).toLocaleString()}</dd>
        </div>
      </dl>
      <div className="fingerprint-hash">
        <div>
          <dt>SHA-256 fingerprint</dt>
          <code>{image.sha256}</code>
        </div>
        <button className="btn-outline" onClick={onCopy}>
          <Copy size={13} /> Copy hash
        </button>
      </div>
      <div className="fingerprint-footer">
        <div className="qr-card">
          {qr ? (
            <img src={qr} alt="QR code opens this authenticated ImageSeal verification page" />
          ) : (
            <QrCode />
          )}
          <span>Authenticated verify link</span>
        </div>
        <div className="fingerprint-actions">
          <button className="btn-outline" onClick={onDownload}>
            <Download size={14} /> Download original
          </button>
          <button className="btn-outline" onClick={downloadCard}>
            <Download size={14} /> Download fingerprint
          </button>
        </div>
      </div>
    </section>
  );
}
