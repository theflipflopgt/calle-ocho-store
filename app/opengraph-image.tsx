import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Calle Ocho Store - Tu estilo, tu paso';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 64,
          background: '#1a1a1a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Background decorations */}
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 40,
            width: 300,
            height: 300,
            background: '#2563eb',
            borderRadius: '50%',
            filter: 'blur(100px)',
            opacity: 0.3,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 40,
            width: 400,
            height: 400,
            background: '#2563eb',
            borderRadius: '50%',
            filter: 'blur(100px)',
            opacity: 0.2,
          }}
        />

        {/* Logo text */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: 120,
              fontWeight: 900,
              color: 'white',
              letterSpacing: '-4px',
              marginBottom: 20,
            }}
          >
            THE FLIP FLOP
          </div>
          <div
            style={{
              fontSize: 32,
              color: '#9ca3af',
              letterSpacing: '4px',
            }}
          >
            TU ESTILO, TU PASO
          </div>
        </div>

        {/* Website URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 24,
            color: '#6b7280',
          }}
        >
          calleochostore.com
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
