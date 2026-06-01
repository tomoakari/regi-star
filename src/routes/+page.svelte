<script lang="ts">
	import { onMount } from 'svelte';
	import { startScanner } from '$lib/scanner';
	import { playBeep, resumeAudio } from '$lib/beep';

	type ScannedItem = {
		jan: string;
		name: string;
		price: number;
		cache: boolean;
		loading: boolean;
		error?: string;
	};

	let videoEl: HTMLVideoElement | undefined = $state();
	let stream: MediaStream | undefined = $state();
	let errorMsg: string | undefined = $state();
	let started = $state(false);
	let stopScanner: (() => void) | undefined = $state();

	/** スキャン履歴（新しい順） */
	let scannedItems: ScannedItem[] = $state([]);

	/** 合計金額 */
	let total = $derived(
		scannedItems
			.filter((item) => !item.loading && !item.error)
			.reduce((sum, item) => sum + item.price, 0)
	);

	async function fetchProduct(jan: string): Promise<void> {
		// ローディング状態で先にリストに追加
		const item: ScannedItem = { jan, name: '検索中...', price: 0, cache: false, loading: true };
		scannedItems = [item, ...scannedItems];

		try {
			const res = await fetch(`/api/product/${jan}`);
			if (!res.ok) {
				const msg = res.status === 404 ? '商品が見つかりません' : `エラー (${res.status})`;
				item.name = msg;
				item.error = msg;
				item.loading = false;
				scannedItems = [...scannedItems]; // 再代入でリアクティブ更新
				return;
			}
			const data = await res.json();
			item.name = data.name;
			item.price = data.price;
			item.cache = data.cache;
			item.loading = false;
			scannedItems = [...scannedItems];
		} catch {
			item.name = '通信エラー';
			item.error = '通信エラー';
			item.loading = false;
			scannedItems = [...scannedItems];
		}
	}

	async function start() {
		try {
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
				await videoEl.play();

				stopScanner = await startScanner(videoEl, (result) => {
					playBeep();
					fetchProduct(result.code);
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

	/** 価格をカンマ区切りでフォーマット */
	function formatPrice(price: number): string {
		return price.toLocaleString('ja-JP');
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
					<li class:latest={i === 0} class:error={!!item.error} class:loading={item.loading}>
						<div class="item-info">
							<span class="item-name">{item.name}</span>
							<span class="item-jan">{item.jan}</span>
						</div>
						<div class="item-price">
							{#if item.loading}
								<span class="spinner">⏳</span>
							{:else if item.error}
								<span class="error-mark">✕</span>
							{:else}
								<span>¥{formatPrice(item.price)}</span>
							{/if}
						</div>
					</li>
				{/each}
			</ul>

			<div class="total">
				<span>合計</span>
				<span class="total-price">¥{formatPrice(total)}</span>
			</div>
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

	li.error {
		opacity: 0.6;
	}

	li.loading {
		opacity: 0.7;
	}

	.item-info {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
		flex: 1;
	}

	.item-name {
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.item-jan {
		font-family: 'Courier New', monospace;
		font-size: 0.7rem;
		color: #888;
		letter-spacing: 0.05em;
	}

	.item-price {
		font-weight: 700;
		font-size: 1.1rem;
		white-space: nowrap;
		margin-left: 0.5rem;
	}

	.spinner {
		animation: pulse 1s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.3; }
	}

	.error-mark {
		color: #ff6b6b;
	}

	/* 合計 */
	.total {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.75rem;
		padding: 0.75rem 0.8rem;
		background: #1e1e38;
		border-radius: 8px;
		border-top: 2px solid #ff6b35;
		font-size: 1.1rem;
		font-weight: 700;
	}

	.total-price {
		font-size: 1.3rem;
		color: #ff6b35;
	}
</style>
