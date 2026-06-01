<script lang="ts">
	import { onMount } from 'svelte';
	import { startScanner } from '$lib/scanner';
	import { playBeep, resumeAudio } from '$lib/beep';
	import { speakProduct } from '$lib/speech';

	type ScannedItem = {
		jan: string;
		name: string;
		genre: string;
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

	/** 商品数 */
	let itemCount = $derived(
		scannedItems.filter((item) => !item.loading && !item.error).length
	);

	async function fetchProduct(jan: string): Promise<void> {
		const item: ScannedItem = { jan, name: '検索中...', genre: '', price: 0, cache: false, loading: true };
		scannedItems = [item, ...scannedItems];

		try {
			const res = await fetch(`/api/product/${jan}`);
			if (!res.ok) {
				const msg = res.status === 404 ? '商品が見つかりません' : `エラー (${res.status})`;
				item.name = msg;
				item.error = msg;
				item.loading = false;
				scannedItems = [...scannedItems];
				return;
			}
			const data = await res.json();
			item.name = data.name;
			item.genre = data.genre ?? '';
			item.price = data.price;
			item.cache = data.cache;
			item.loading = false;
			scannedItems = [...scannedItems];

			speakProduct(data.name, data.price);
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

	function formatPrice(price: number): string {
		return price.toLocaleString('ja-JP');
	}

	onMount(() => {
		return () => stop();
	});
</script>

<div class="app">
	<!-- ヘッダー -->
	<header class="header">
		<div class="header-left">
			<span class="logo">🛒</span>
			<h1>regi-star</h1>
		</div>
		<!-- install 要素: 対応ブラウザでインストールボタン表示 -->
		<install class="install-btn">
			<button class="install-fallback" title="PWAとしてインストール">
				📲
			</button>
		</install>
	</header>

	<!-- スキャナーエリア -->
	<div class="scanner-area">
		<div class="viewfinder" class:active={started}>
			<video
				bind:this={videoEl}
				autoplay
				playsinline
				muted
				class:hidden={!started}
			></video>

			{#if !started}
				<div class="viewfinder-idle">
					<div class="idle-icon">📷</div>
					<p>バーコードをスキャンしよう</p>
				</div>
			{/if}

			{#if started}
				<div class="crosshair">
					<div class="crosshair-corner tl"></div>
					<div class="crosshair-corner tr"></div>
					<div class="crosshair-corner bl"></div>
					<div class="crosshair-corner br"></div>
					<div class="scan-beam"></div>
				</div>
			{/if}
		</div>

		{#if errorMsg}
			<p class="error-msg">⚠️ {errorMsg}</p>
		{/if}

		<div class="scan-controls">
			{#if !started}
				<button onclick={start} class="btn-scan">
					<span class="btn-icon">⚡</span>
					スキャン開始
				</button>
			{:else}
				<button onclick={stop} class="btn-stop">
					停止
				</button>
			{/if}
		</div>
	</div>

	<!-- 結果リスト -->
	{#if scannedItems.length > 0}
		<div class="receipt">
			<div class="receipt-header">
				<span class="receipt-title">スキャン済み ({itemCount}点)</span>
				<button onclick={clearHistory} class="btn-clear">クリア</button>
			</div>

			<ul class="item-list">
				{#each scannedItems as item, i}
					<li class:latest={i === 0} class:has-error={!!item.error} class:is-loading={item.loading}>
						<div class="item-left">
							<span class="item-name">{item.name}</span>
							<span class="item-meta">
								{#if item.genre}<span class="item-genre">{item.genre}</span>{/if}
								<span class="item-jan">{item.jan}</span>
							</span>
						</div>
						<div class="item-right">
							{#if item.loading}
								<span class="loading-dot">...</span>
							{:else if item.error}
								<span class="error-x">✕</span>
							{:else}
								<span class="item-price">¥{formatPrice(item.price)}</span>
							{/if}
						</div>
					</li>
				{/each}
			</ul>

			<div class="total-bar">
				<span class="total-label">合計</span>
				<span class="total-amount">¥{formatPrice(total)}</span>
			</div>
		</div>
	{/if}
</div>

<style>
	/* ===== App Shell ===== */
	.app {
		width: 100%;
		max-width: 480px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		min-height: 100dvh;
	}

	/* ===== Header ===== */
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: white;
		border-bottom: 1px solid #e5e5ea;
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.logo {
		font-size: 1.4rem;
	}

	h1 {
		font-size: 1.2rem;
		font-weight: 700;
		color: #1d1d1f;
		letter-spacing: -0.02em;
	}

	/* install 要素 (ブラウザ未対応ならフォールバック表示) */
	.install-btn {
		display: inline-block;
	}

	.install-fallback {
		background: none;
		border: none;
		font-size: 1.4rem;
		cursor: pointer;
		padding: 0.25rem;
		opacity: 0.6;
	}

	/* ===== Scanner Area ===== */
	.scanner-area {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.viewfinder {
		position: relative;
		width: 100%;
		aspect-ratio: 4 / 3;
		border-radius: 16px;
		overflow: hidden;
		background: #e8e8ed;
		box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
	}

	.viewfinder.active {
		box-shadow: 0 2px 20px rgba(255, 107, 53, 0.2);
	}

	video {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	video.hidden {
		display: none;
	}

	.viewfinder-idle {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		gap: 0.5rem;
	}

	.idle-icon {
		font-size: 2.5rem;
		opacity: 0.4;
	}

	.viewfinder-idle p {
		color: #86868b;
		font-size: 0.9rem;
	}

	/* クロスヘアー (ハンディスキャナ風) */
	.crosshair {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.crosshair-corner {
		position: absolute;
		width: 28px;
		height: 28px;
		border-color: #FF6B35;
		border-style: solid;
		border-width: 0;
	}

	.crosshair-corner.tl {
		top: 15%;
		left: 15%;
		border-top-width: 3px;
		border-left-width: 3px;
		border-top-left-radius: 6px;
	}

	.crosshair-corner.tr {
		top: 15%;
		right: 15%;
		border-top-width: 3px;
		border-right-width: 3px;
		border-top-right-radius: 6px;
	}

	.crosshair-corner.bl {
		bottom: 15%;
		left: 15%;
		border-bottom-width: 3px;
		border-left-width: 3px;
		border-bottom-left-radius: 6px;
	}

	.crosshair-corner.br {
		bottom: 15%;
		right: 15%;
		border-bottom-width: 3px;
		border-right-width: 3px;
		border-bottom-right-radius: 6px;
	}

	.scan-beam {
		position: absolute;
		left: 15%;
		right: 15%;
		height: 2px;
		background: linear-gradient(90deg, transparent, #FF6B35, transparent);
		box-shadow: 0 0 12px rgba(255, 107, 53, 0.6);
		animation: beam 2s ease-in-out infinite;
	}

	@keyframes beam {
		0%, 100% { top: 20%; }
		50% { top: 75%; }
	}

	.error-msg {
		color: #ff3b30;
		font-size: 0.85rem;
		text-align: center;
		padding: 0.5rem;
		background: #fff2f0;
		border-radius: 8px;
	}

	/* ===== Scan Button ===== */
	.scan-controls {
		display: flex;
		justify-content: center;
	}

	.btn-scan {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.85rem 2rem;
		border: none;
		border-radius: 50px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		background: #FF6B35;
		color: white;
		box-shadow: 0 4px 14px rgba(255, 107, 53, 0.35);
		transition: transform 0.15s, box-shadow 0.15s;
	}

	.btn-scan:active {
		transform: scale(0.97);
		box-shadow: 0 2px 8px rgba(255, 107, 53, 0.25);
	}

	.btn-icon {
		font-size: 1.1rem;
	}

	.btn-stop {
		padding: 0.7rem 2rem;
		border: 2px solid #d1d1d6;
		border-radius: 50px;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		background: white;
		color: #86868b;
		transition: border-color 0.15s;
	}

	.btn-stop:active {
		border-color: #FF6B35;
		color: #FF6B35;
	}

	/* ===== Receipt / Results ===== */
	.receipt {
		flex: 1;
		background: white;
		border-top: 1px solid #e5e5ea;
		padding: 0.75rem 1rem 1rem;
	}

	.receipt-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.receipt-title {
		font-size: 0.85rem;
		font-weight: 600;
		color: #86868b;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.btn-clear {
		background: none;
		border: none;
		color: #FF6B35;
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		padding: 0.25rem 0;
	}

	.item-list {
		list-style: none;
		display: flex;
		flex-direction: column;
	}

	li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.7rem 0;
		border-bottom: 1px solid #f2f2f7;
		transition: background 0.2s;
	}

	li.latest {
		background: #fff8f5;
		margin: 0 -1rem;
		padding: 0.7rem 1rem;
		border-radius: 8px;
		border-bottom: none;
	}

	li.has-error {
		opacity: 0.5;
	}

	li.is-loading {
		opacity: 0.6;
	}

	.item-left {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		min-width: 0;
		flex: 1;
	}

	.item-name {
		font-weight: 500;
		font-size: 0.95rem;
		color: #1d1d1f;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.item-meta {
		display: flex;
		gap: 0.4rem;
		align-items: center;
	}

	.item-genre {
		font-size: 0.7rem;
		color: #FF6B35;
		background: rgba(255, 107, 53, 0.1);
		padding: 0.05rem 0.35rem;
		border-radius: 4px;
		font-weight: 500;
	}

	.item-jan {
		font-family: 'SF Mono', 'Courier New', monospace;
		font-size: 0.7rem;
		color: #aeaeb2;
		letter-spacing: 0.03em;
	}

	.item-right {
		margin-left: 0.75rem;
		white-space: nowrap;
	}

	.item-price {
		font-weight: 600;
		font-size: 1rem;
		color: #1d1d1f;
	}

	.loading-dot {
		color: #aeaeb2;
		animation: pulse 1s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.3; }
	}

	.error-x {
		color: #ff3b30;
		font-weight: 600;
	}

	/* ===== Total Bar ===== */
	.total-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 0.75rem;
		padding-top: 0.75rem;
		border-top: 2px solid #1d1d1f;
	}

	.total-label {
		font-size: 1rem;
		font-weight: 600;
		color: #1d1d1f;
	}

	.total-amount {
		font-size: 1.4rem;
		font-weight: 700;
		color: #FF6B35;
	}
</style>
