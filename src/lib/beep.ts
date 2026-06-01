/**
 * beep.ts — Web Audio API でレジの「ピッ」音を生成・再生する
 * 音源ファイル不要、軽量な矩形波ビープ
 */

let audioCtx: AudioContext | undefined;

/** AudioContext を取得（モバイルのユーザー操作制約対策で遅延初期化） */
function getAudioContext(): AudioContext {
	if (!audioCtx) {
		audioCtx = new AudioContext();
	}
	return audioCtx;
}

/**
 * ユーザー操作起点で AudioContext を resume する
 * モバイルの自動再生ポリシー対策として、最初のタップ時に呼ぶ
 */
export async function resumeAudio(): Promise<void> {
	const ctx = getAudioContext();
	if (ctx.state === 'suspended') {
		await ctx.resume();
	}
}

/**
 * レジの「ピッ」音を再生する
 * @param frequency 周波数 (Hz) デフォルト 1800Hz（レジっぽい高音）
 * @param duration 長さ (秒) デフォルト 0.08秒（短い「ピッ」）
 */
export function playBeep(frequency = 1800, duration = 0.08): void {
	const ctx = getAudioContext();
	const oscillator = ctx.createOscillator();
	const gainNode = ctx.createGain();

	oscillator.type = 'square';
	oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

	// 急なクリック音を防ぐため、短いフェードアウトを入れる
	gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
	gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

	oscillator.connect(gainNode);
	gainNode.connect(ctx.destination);

	oscillator.start(ctx.currentTime);
	oscillator.stop(ctx.currentTime + duration);
}
