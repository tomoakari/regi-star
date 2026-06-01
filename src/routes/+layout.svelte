<script>
	let { children } = $props();
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
	<meta name="theme-color" content="#FF6B35" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
	<title>regi-star</title>
</svelte:head>

<main>
	{@render children()}
</main>

<style>
	:global(*, *::before, *::after) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(body) {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
		background: #f5f5f7;
		color: #1d1d1f;
		min-height: 100dvh;
		-webkit-font-smoothing: antialiased;
	}

	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 100dvh;
		padding: 0;
	}
</style>
