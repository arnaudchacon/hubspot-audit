import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'HubSpot Health Check — CRM Audit Tool';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#FFFFFF',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <p style={{ fontSize: 13, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 28 }}>
          FIG 0.1 — A CRM AUDIT TOOL
        </p>
        <h1 style={{ fontSize: 58, fontWeight: 600, color: '#0F0F0F', lineHeight: 1.08, letterSpacing: '-0.02em', marginBottom: 32, maxWidth: 860 }}>
          Most HubSpot instances are quietly broken.
        </h1>
        <p style={{ fontSize: 20, color: '#555555', lineHeight: 1.5 }}>
          Upload your contacts export and get a scored audit report with specific, actionable fix recommendations.
        </p>
        <p style={{ position: 'absolute', bottom: 60, left: 80, fontSize: 13, color: '#888888' }}>
          Built by Arnaud Chacon
        </p>
      </div>
    ),
    { ...size }
  );
}
