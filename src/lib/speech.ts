/**
 * speech.ts — Web Speech API で商品名と価格を読み上げる
 * 追加コストゼロ、ブラウザ内蔵の音声合成を使用
 */

/**
 * 商品情報を読み上げる
 * 例: 「牛乳。350円です。」
 */
export function speakProduct(name: string, price: number): void {
	if (!('speechSynthesis' in window)) {
		console.warn('SpeechSynthesis is not supported in this browser.');
		return;
	}

	const text = `${name}。${price}円です。`;
	const utterance = new SpeechSynthesisUtterance(text);

	utterance.lang = 'ja-JP';
	utterance.rate = 1.1; // やや速めでテンポよく
	utterance.pitch = 1.0;
	utterance.volume = 1.0;

	// 日本語音声を優先的に選択
	const voices = speechSynthesis.getVoices();
	const jaVoice = voices.find((v) => v.lang.startsWith('ja'));
	if (jaVoice) {
		utterance.voice = jaVoice;
	}

	// 前の読み上げが残っていたらキャンセル
	speechSynthesis.cancel();
	speechSynthesis.speak(utterance);
}
