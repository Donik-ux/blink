// Сжатие картинки на клиенте: квадратный crop по центру + ресайз до maxSize, JPEG quality
export const compressImage = (file, { maxSize = 256, quality = 0.82 } = {}) =>
  new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith('image/')) {
      reject(new Error('Не картинка'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Не смогли прочитать файл'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Не смогли декодировать картинку'));
      img.onload = () => {
        // Квадратный crop по центру
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, side, side, 0, 0, maxSize, maxSize);

        // Если получилось > 70KB — снижаем качество шагами
        let q = quality;
        let dataUrl = canvas.toDataURL('image/jpeg', q);
        while (dataUrl.length > 90_000 && q > 0.4) {
          q -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', q);
        }
        resolve(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
