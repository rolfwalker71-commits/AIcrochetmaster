import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#C45C26",
          borderRadius: 96,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 340,
            height: 340,
            borderRadius: "50%",
            background: "#F4EAD8",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 180,
          }}
        >
          🧶
        </div>
      </div>
    ),
    size,
  );
}
