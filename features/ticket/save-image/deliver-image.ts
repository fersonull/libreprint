/**
 * Hands a PNG to the customer. Phones get the share sheet so it can go to
 * Photos (a download lands in Files); everything else downloads.
 */
export async function deliverImage(dataUrl: string, fileName: string, title: string) {
  if (window.matchMedia("(pointer: coarse)").matches && navigator.canShare) {
    const file = new File([await (await fetch(dataUrl)).blob()], fileName, { type: "image/png" });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title });
        return;
      } catch (error) {
        // The customer closed the sheet: done. Anything else (e.g. the click's activation expired while rendering): download instead.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
  }
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = fileName;
  link.click();
}
