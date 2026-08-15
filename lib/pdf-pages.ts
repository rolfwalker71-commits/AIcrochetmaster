import type { ExtractedPattern } from "./types";

const MAX_WIDTH = 900;
const JPEG_QUALITY = 0.72;

export async function attachPdfPageImages(
  file: File,
  steps: ExtractedPattern["steps"],
): Promise<ExtractedPattern["steps"]> {
  const pages = [
    ...new Set(
      steps
        .map((step) => step.pdfPage)
        .filter((page): page is number => typeof page === "number" && page >= 1),
    ),
  ];
  if (pages.length === 0) return steps;

  const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
  GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const pdf = await getDocument({ data: await file.arrayBuffer() }).promise;
  const images = new Map<number, string>();

  for (const pageNumber of pages) {
    if (pageNumber > pdf.numPages) continue;
    const page = await pdf.getPage(pageNumber);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(1.4, MAX_WIDTH / base.width);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) continue;
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    images.set(pageNumber, canvas.toDataURL("image/jpeg", JPEG_QUALITY));
  }

  return steps.map((step) => {
    if (!step.pdfPage) return step;
    const imageDataUrl = images.get(step.pdfPage);
    return imageDataUrl ? { ...step, imageDataUrl } : step;
  });
}
