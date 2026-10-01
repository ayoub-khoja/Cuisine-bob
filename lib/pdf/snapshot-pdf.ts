/** Paint an on-screen HTML sheet into a PDF so Arabic stays shaped by the browser. */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("تعذر تجهيز المعاينة"));
    image.src = src;
  });
}

export async function downloadElementAsPdf(node: HTMLElement, filename: string): Promise<void> {
  const { toPng } = await import("html-to-image");
  const { jsPDF } = await import("jspdf");
  if (document.fonts?.ready) await document.fonts.ready;

  const options = {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
  };
  let dataUrl: string;
  try {
    dataUrl = await toPng(node, options);
  } catch {
    dataUrl = await toPng(node, { ...options, fontEmbedCSS: "" });
  }
  const image = await loadImage(dataUrl);
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgHeight = (image.height * pageWidth) / image.width;

  let heightLeft = imgHeight;
  let position = 0;
  pdf.addImage(dataUrl, "PNG", 0, position, pageWidth, imgHeight);
  heightLeft -= pageHeight;
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(dataUrl, "PNG", 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;
  }
  pdf.save(filename);
}
