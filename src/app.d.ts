// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	/** BarcodeDetector Web API (Chrome/Edge) */
	interface BarcodeDetectorOptions {
		formats?: string[];
	}

	interface DetectedBarcode {
		boundingBox: DOMRectReadOnly;
		cornerPoints: { x: number; y: number }[];
		format: string;
		rawValue: string;
	}

	class BarcodeDetector {
		constructor(options?: BarcodeDetectorOptions);
		static getSupportedFormats(): Promise<string[]>;
		detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>;
	}
}

export {};
