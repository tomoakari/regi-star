<script>
	let { children } = $props();
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
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
		font-family: system-ui, -apple-system, sans-serif;
		background: #1a1a2e;
		color: #eee;
		min-height: 100dvh;
	}

	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100dvh;
		padding: 1rem;
	}
</style>
