var Jimp = require('jimp');
async function image2braille(file, width, invert = false) {
    const image = (await Jimp.read(file)).resize(width, Jimp.AUTO).bitmap;
    const height = width * image.height / image.width;
    const pixels = image.data;
    const crop = x => x < 0 ? 0 : x > 255 ? 255 : x;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (x + y * width) * 4;
            const oldpixel = [pixels[index], pixels[index + 1], pixels[index + 2]];
            const newpixel = oldpixel.map((i) => i > 127 ? 255 : 0);
            pixels[index + 0] = newpixel[0];
            pixels[index + 1] = newpixel[1];
            pixels[index + 2] = newpixel[2];
            const quant_error = [oldpixel[0] - newpixel[0], oldpixel[1] - newpixel[1], oldpixel[2] - newpixel[2]];
            for (let i = 0; i < 3; i++) {
                if (x + 1 < width)                   pixels[index + 4             + i] = crop(pixels[index + 4             + i] + 7 * quant_error[i] / 16);
                if (x - 1 >= 0 && y + 1 < height)    pixels[index - 4 + 4 * width + i] = crop(pixels[index - 4 + 4 * width + i] + 3 * quant_error[i] / 16);
                if (y + 1 < height)                  pixels[index     + 4 * width + i] = crop(pixels[index     + 4 * width + i] + 5 * quant_error[i] / 16);
                if (x + 1 < width && y + 1 < height) pixels[index + 4 + 4 * width + i] = crop(pixels[index + 4 + 4 * width + i] + 1 * quant_error[i] / 16);
            }
        }
    }
    let black_and_white = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (x + y * width) * 4;
            black_and_white.push(0.3 * pixels[index] + 0.586 * pixels[index + 1] + 0.114 * pixels[index + 2] < 127 ? 1 : 0);
        }
    }
    if (invert) {
        black_and_white = black_and_white.map((i) => i ? 0 : 1);
    }
    let output = "";
    for (let y = 0; y < height / 3; y++) {
        for (let x = 0; x < width / 2; x++) {
            output += String.fromCharCode(0x2800 + ([0,1,2].map((i) => [0,1].map((j) => black_and_white[width * (i + 3 * y) + 2 * x + j] << (3 * j + i)).reduce((a, b) => a + b)).reduce((a, b) => a + b) || 1));
        }
        output += "\n";
    }
    return output;
}
module.exports = image2braille;