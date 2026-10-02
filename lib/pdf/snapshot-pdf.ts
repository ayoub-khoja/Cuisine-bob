/** Paint an on-screen HTML sheet into a PDF so Arabic stays shaped by the browser. */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("تعذر تجهيز المعاينة"));
    image.src = src;
  });
}

export async function downloadElementAsPdf(
  node: HTMLElement,
  filename: string,
  orientation: "portrait" | "landscape" = "portrait",
): Promise<void> {
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
  const pdf = new jsPDF({ orientation, unit: "mm", format: "a4" });
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

/** Print the same on-screen sheet the PDF uses. */
export async function printElement(node: HTMLElement): Promise<void> {
  const { toPng } = await import("html-to-image");
  if (document.fonts?.ready) await document.fonts.ready;
  const options = { pixelRatio: 2, backgroundColor: "#ffffff" };
  let dataUrl: string;
  try {
    dataUrl = await toPng(node, options);
  } catch {
    dataUrl = await toPng(node, { ...options, fontEmbedCSS: "" });
  }

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.left = "-2000px";
  frame.style.width = "794px";
  frame.style.height = "1123px";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) {
    frame.remove();
    throw new Error("تعذر الطباعة");
  }
  doc.open();
  doc.write(
    `<!DOCTYPE html><html><head><title>طباعة</title><style>@page{size:A4 portrait;margin:12mm}html,body{margin:0}img{width:100%;height:auto}</style></head><body><img alt="" src="${dataUrl}" /></body></html>`,
  );
  doc.close();
  await new Promise<void>((resolve) => {
    const image = doc.querySelector("img");
    if (!image || image.complete) resolve();
    else image.onload = () => resolve();
  });
  win.focus();
  win.print();
  window.setTimeout(() => frame.remove(), 1500);
}
