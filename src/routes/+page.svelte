<script lang="ts">
	import { onMount } from 'svelte';

	let videoEl: HTMLVideoElement | undefined = $state();
	let stream: MediaStream | undefined = $state();
	let errorMsg: string | undefined = $state();
	let started = $state(false);

	async function startCamera() {
		try {
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
			}
			started = true;
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'カメラを起動できませんでした';
		}
	}

	function stopCamera() {
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

	onMount(() => {
		return () => stopCamera();
	});
</script>

<div class="scanner">
	<h1>🛒 regi-star</h1>
	<p class="subtitle">スーパーのレジ打ちごっこ</p>

	{#if errorMsg}
		<p class="error">⚠️ {errorMsg}</p>
	{/if}

	<div class="video-container">
		<!-- svelte-ignore element_invalid_self_closing_tag -->
		<video
			bind:this={videoEl}
			autoplay
			playsinline
			muted
			class:hidden={!started}
		/>
		{#if !started}
			<div class="placeholder">📷 カメラ待機中...</div>
		{/if}
	</div>

	<div class="controls">
		{#if !started}
			<button onclick={startCamera} class="btn btn-start">
				カメラを起動する
			</button>
		{:else}
			<button onclick={stopCamera} class="btn btn-stop">
				カメラを停止する
			</button>
		{/if}
	</div>
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
</style>
