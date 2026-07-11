"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="es">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 24,
            background: "#fbf8f1",
            color: "#202621",
            fontFamily: "sans-serif",
            textAlign: "center",
          }}
        >
          <div>
            <p style={{ color: "#b9745d", fontWeight: 700 }}>
              Interior Color Studio
            </p>
            <h1 style={{ fontSize: 38, marginTop: 16 }}>
              No pudimos iniciar la aplicación
            </h1>
            <p style={{ color: "#657067", marginTop: 12 }}>
              Intenta cargarla nuevamente o vuelve al inicio.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 12,
                marginTop: 28,
              }}
            >
              <button
                onClick={reset}
                style={{
                  border: 0,
                  borderRadius: 999,
                  background: "#202621",
                  color: "white",
                  padding: "12px 20px",
                  fontWeight: 700,
                }}
              >
                Reintentar
              </button>
            <Link
              href="/"
                style={{
                  border: "1px solid #ded8cc",
                  borderRadius: 999,
                  color: "#202621",
                  padding: "12px 20px",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Volver al inicio
            </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
