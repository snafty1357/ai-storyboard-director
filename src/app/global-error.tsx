'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{
        margin: 0,
        backgroundColor: '#0a0a0f',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{
          maxWidth: '400px',
          width: '100%',
          padding: '32px',
          backgroundColor: '#141420',
          border: '1px solid #2a2a3a',
          borderRadius: '12px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 24px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h2 style={{ color: '#fff', fontSize: '20px', marginBottom: '8px' }}>
            致命的なエラー
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '24px' }}>
            アプリケーションの読み込み中にエラーが発生しました。
          </p>

          {error.message && (
            <div style={{
              backgroundColor: '#0d0d12',
              border: '1px solid #2a2a3a',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>エラー詳細:</p>
              <p style={{ fontSize: '12px', color: '#f87171', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {error.message}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={reset}
              style={{
                padding: '10px 24px',
                backgroundColor: '#4f46e5',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              再試行
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/';
              }}
              style={{
                padding: '10px 24px',
                backgroundColor: '#2a2a3a',
                color: '#d1d5db',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              リセット
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
