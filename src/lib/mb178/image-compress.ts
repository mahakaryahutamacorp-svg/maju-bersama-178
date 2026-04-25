/**
 * Kompresi gambar client-side menggunakan Canvas API.
 * Menggunakan WebP untuk ukuran file terkecil dengan kualitas terbaik.
 * Sangat penting untuk performa di "HP kentang" dan menghemat kuota.
 */
export async function compressImage(
  file: File,
  { maxWidth = 1200, quality = 0.8, format = "image/webp" } = {}
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Resize proporsional jika melebihi maxWidth
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return reject(new Error("Gagal mendapatkan context canvas"));

        // Fill background putih untuk format non-alpha jika perlu
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Jika WebP tidak didukung (jarang), fallback ke JPEG
              if (blob.type !== format && format === "image/webp") {
                canvas.toBlob((jBlob) => {
                  if (jBlob) resolve(jBlob);
                  else reject(new Error("Gagal membuat fallback JPEG"));
                }, "image/jpeg", quality);
              } else {
                resolve(blob);
              }
            } else {
              reject(new Error("Gagal membuat blob dari canvas"));
            }
          },
          format,
          quality
        );
      };
      img.onerror = () => reject(new Error("Gagal memuat gambar"));
    };
    reader.onerror = () => reject(new Error("Gagal membaca file"));
  });
}
