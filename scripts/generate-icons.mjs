// PWA アイコン生成スクリプト
import sharp from 'sharp';

const sizes = [192, 512];

async function generateIcon(size) {
	const svg = `
		<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
			<rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#FF6B35"/>
			<text x="50%" y="48%" text-anchor="middle" dominant-baseline="central"
				font-family="sans-serif" font-size="${size * 0.45}">🛒</text>
			<text x="50%" y="78%" text-anchor="middle" dominant-baseline="central"
				font-family="sans-serif" font-weight="bold" font-size="${size * 0.12}" fill="white">regi-star</text>
		</svg>
	`;
	await sharp(Buffer.from(svg)).png().toFile(`static/pwa-${size}x${size}.png`);
	console.log(`Generated pwa-${size}x${size}.png`);
}

for (const size of sizes) {
	await generateIcon(size);
}

// apple-touch-icon (180x180)
const appleSvg = `
	<svg width="180" height="180" xmlns="http://www.w3.org/2000/svg">
		<rect width="180" height="180" rx="27" fill="#FF6B35"/>
		<text x="50%" y="48%" text-anchor="middle" dominant-baseline="central"
			font-family="sans-serif" font-size="81">🛒</text>
		<text x="50%" y="78%" text-anchor="middle" dominant-baseline="central"
			font-family="sans-serif" font-weight="bold" font-size="21.6" fill="white">regi-star</text>
	</svg>
`;
await sharp(Buffer.from(appleSvg)).png().toFile('static/apple-touch-icon.png');
console.log('Generated apple-touch-icon.png');
