const WIDTH = 640;
const HEIGHT = 400;

export async function compactHeaderImage(dataUrl: string): Promise<string> {
  if (typeof document === "undefined") return dataUrl;
  const image = new Image();
  image.src = dataUrl;
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) return dataUrl;

  const scale = Math.max(WIDTH / image.width, HEIGHT / image.height);
  const sourceWidth = WIDTH / scale;
  const sourceHeight = HEIGHT / scale;
  context.drawImage(
    image,
    (image.width - sourceWidth) / 2,
    (image.height - sourceHeight) / 2,
    sourceWidth,
    sourceHeight,
    0,
    0,
    WIDTH,
    HEIGHT,
  );
  return canvas.toDataURL("image/jpeg", 0.72);
}
