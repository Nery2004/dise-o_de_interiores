import { ImageResponse } from "next/og";

export const alt = "Interior Color Studio — visualiza colores antes de pintar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f7f2e8",
          color: "#202621",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: "53%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "#50634f",
              fontWeight: 700,
            }}
          >
            Interior Color Studio
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 58,
              lineHeight: 1.04,
              fontWeight: 700,
            }}
          >
            Visualiza nuevos colores antes de pintar.
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 24,
              color: "#657067",
            }}
          >
            Prueba, compara y presenta tonos en tus propios espacios.
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 38 }}>
            {["#A8B5A2", "#D8C3A5", "#C98276", "#304A60"].map((color) => (
              <div
                key={color}
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 27,
                  background: color,
                  border: "3px solid white",
                }}
              />
            ))}
          </div>
        </div>
        <div
          style={{
            width: "47%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 470,
              height: 390,
              position: "relative",
              display: "flex",
              overflow: "hidden",
              borderRadius: 28,
              background: "#dfd8ca",
              boxShadow: "0 25px 55px rgba(32,38,33,.18)",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                background:
                  "linear-gradient(145deg,#d7c7b1 0 56%,#b7a58f 56% 70%,#665848 70%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 52,
                bottom: 55,
                width: 350,
                height: 115,
                borderRadius: 22,
                display: "flex",
                background: "#eee9df",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 235,
                top: 0,
                bottom: 0,
                width: 3,
                display: "flex",
                background: "white",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 235,
                height: 260,
                display: "flex",
                background: "rgba(143,160,135,.62)",
              }}
            />
          </div>
        </div>
      </div>
    ),
    size,
  );
}
