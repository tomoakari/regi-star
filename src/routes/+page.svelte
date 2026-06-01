<script lang="ts">
	import { onMount } from 'svelte';
	import { startScanner, type ScanResult } from '$lib/scanner';
	import { playBeep, resumeAudio } from '$lib/beep';

	let videoEl: HTMLVideoElement | undefined = $state();
	let stream: MediaStream | undefined = $state();
	let errorMsg: string | undefined = $state();
	let started = $state(false);
	let stopScanner: (() => void) | undefined = $state();

	/** スキャン履歴（新しい順） */
	let scannedItems: ScanResult[] = $state([]);

	async function start() {
		try {
			// モバイルの自動再生ポリシー対策: ユーザー操作起点で AudioContext を resume
			await resumeAudio();

			stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: { ideal: 'environment' },
					width: { ideal: 1280 },
					height: { ideal: 720 }
				},
				audio: false
			});

			if (videoEl) {
				videoEl.srcObject = stream;
				// video が再生開始してからスキャナーを起動
				await videoEl.play();

				stopScanner = await startScanner(videoEl, (result) => {
					playBeep();
					scannedItems = [result, ...scannedItems];
				});
			}

			started = true;
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'カメラを起動できませんでした';
		}
	}

	function stop() {
		stopScanner?.();
		stopScanner = undefined;

		if (stream) {
			for (const track of stream.getTracks()) {
				track.stop();
			}
			stream = undefined;
		}
		if (videoEl) {
			videoEl.srcObject = null;
		}
		started = false;
	}

	function clearHistory() {
		scannedItems = [];
	}

	onMount(() => {
		return () => stop();
	});
</script>

<div class="scanner">
	<h1>🛒 regi-star</h1>
	<p class="subtitle">スーパーのレジ打ちごっこ</p>

	{#if errorMsg}
		<p class="error">⚠️ {errorMsg}</p>
	{/if}

	<div class="video-container">
		<video
			bind:this={videoEl}
			autoplay
			playsinline
			muted
			class:hidden={!started}
		></video>
		{#if !started}
			<div class="placeholder">📷 カメラ待機中...</div>
		{/if}
		{#if started}
			<div class="scan-line"></div>
		{/if}
	</div>

	<div class="controls">
		{#if !started}
			<button onclick={start} class="btn btn-start">
				スキャン開始
			</button>
		{:else}
			<button onclick={stop} class="btn btn-stop">
				停止
			</button>
		{/if}
	</div>

	{#if scannedItems.length > 0}
		<div class="results">
			<div class="results-header">
				<h2>スキャン履歴</h2>
				<button onclick={clearHistory} class="btn-clear">クリア</button>
			</div>
			<ul>
				{#each scannedItems as item, i}
					<li class:latest={i === 0}>
						<span class="code">{item.code}</span>
						<span class="format">{item.format}</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
	.scanner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		width: 100%;
		max-width: 480px;
	}

	h1 {
		font-size: 1.8rem;
	}

	.subtitle {
		font-size: 0.9rem;
		color: #aaa;
	}

	.video-container {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		border-radius: 12px;
		overflow: hidden;
		background: #111;
		border: 2px solid #333;
	}

	video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	video.hidden {
		display: none;
	}

	.placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		font-size: 1.2rem;
		color: #666;
	}

	/* スキャン中のアニメーションライン */
	.scan-line {
		position: absolute;
		left: 10%;
		right: 10%;
		height: 2px;
		background: #ff6b35;
		box-shadow: 0 0 8px #ff6b35;
		animation: scan 2s ease-in-out infinite;
	}

	@keyframes scan {
		0%, 100% { top: 30%; }
		50% { top: 70%; }
	}

	.error {
		color: #ff6b6b;
		font-size: 0.9rem;
		text-align: center;
	}

	.controls {
		display: flex;
		gap: 0.5rem;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.2s;
	}

	.btn-start {
		background: #ff6b35;
		color: white;
	}

	.btn-start:hover {
		background: #e55a2b;
	}

	.btn-stop {
		background: #555;
		color: white;
	}

	.btn-stop:hover {
		background: #444;
	}

	/* スキャン結果 */
	.results {
		width: 100%;
		margin-top: 0.5rem;
	}

	.results-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.results-header h2 {
		font-size: 1rem;
		font-weight: 600;
	}

	.btn-clear {
		background: none;
		border: 1px solid #555;
		color: #aaa;
		padding: 0.25rem 0.75rem;
		border-radius: 6px;
		font-size: 0.8rem;
		cursor: pointer;
	}

	.btn-clear:hover {
		border-color: #888;
		color: #eee;
	}

	ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.6rem 0.8rem;
		background: #252540;
		border-radius: 8px;
		font-size: 0.9rem;
		transition: background 0.3s;
	}

	li.latest {
		background: #2a2a50;
		border: 1px solid #ff6b35;
	}

	.code {
		font-family: 'Courier New', monospace;
		font-weight: 700;
		font-size: 1.1rem;
		letter-spacing: 0.05em;
	}

	.format {
		color: #888;
		font-size: 0.75rem;
		text-transform: uppercase;
	}
</style>
