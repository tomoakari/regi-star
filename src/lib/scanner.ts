/**
 * scanner.ts — バーコード検出モジュール
 * BarcodeDetector (ネイティブ) を優先し、未対応なら @zxing/browser にフォールバック
 * 同一JANの連続検出はデバウンスで弾く
 */

export type ScanResult = {
	code: string;
	format: string;
};

export type OnDetect = (result: ScanResult) => void;

/** ネイティブ BarcodeDetector が使えるか */
function hasNativeBarcodeDetector(): boolean {
	return 'BarcodeDetector' in window;
}

/**
 * バーコードスキャナーを開始する
 * @param video スキャン対象の video 要素
 * @param onDetect 検出時コールバック（デバウンス済み）
 * @param debounceMs 同一コードの再検出を弾く間隔 (ms)
 * @returns stop 関数（クリーンアップ用）
 */
export async function startScanner(
	video: HTMLVideoElement,
	onDetect: OnDetect,
	debounceMs = 2000
): Promise<() => void> {
	const lastDetected = new Map<string, number>();

	function shouldReport(code: string): boolean {
		const now = Date.now();
		const last = lastDetected.get(code);
		if (last && now - last < debounceMs) {
			return false;
		}
		lastDetected.set(code, now);
		return true;
	}

	if (hasNativeBarcodeDetector()) {
		return startNativeScanner(video, onDetect, shouldReport);
	}
	return startZxingScanner(video, onDetect, shouldReport);
}

/** ネイティブ BarcodeDetector によるスキャン */
function startNativeScanner(
	video: HTMLVideoElement,
	onDetect: OnDetect,
	shouldReport: (code: string) => boolean
): () => void {
	const detector = new BarcodeDetector({
		formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e']
	});

	let active = true;
	let rafId: number;

	async function tick() {
		if (!active) return;

		if (video.readyState >= video.HAVE_ENOUGH_DATA) {
			try {
				const barcodes = await detector.detect(video);
				for (const barcode of barcodes) {
					if (barcode.rawValue && shouldReport(barcode.rawValue)) {
						onDetect({ code: barcode.rawValue, format: barcode.format });
					}
				}
			} catch {
				// detect() はフレーム不良時にエラーを投げることがある — 無視して続行
			}
		}

		rafId = requestAnimationFrame(tick);
	}

	rafId = requestAnimationFrame(tick);

	return () => {
		active = false;
		cancelAnimationFrame(rafId);
	};
}

/** @zxing/browser フォールバックによるスキャン */
async function startZxingScanner(
	video: HTMLVideoElement,
	onDetect: OnDetect,
	shouldReport: (code: string) => boolean
): Promise<() => void> {
	const { BrowserMultiFormatOneDReader } = await import('@zxing/browser');
	const reader = new BrowserMultiFormatOneDReader();

	const controls = reader.scan(video, (result, error) => {
		if (error) return; // デコード失敗は正常（映像に常にバーコードがあるとは限らない）
		if (result) {
			const code = result.getText();
			if (code && shouldReport(code)) {
				onDetect({ code, format: result.getBarcodeFormat()?.toString() ?? 'unknown' });
			}
		}
	});

	return () => {
		controls.stop();
	};
}
