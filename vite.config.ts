import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		SvelteKitPWA({
			manifest: {
				name: 'regi-star — レジ打ちごっこ',
				short_name: 'regi-star',
				description: 'バーコードをスキャンして遊ぶレジ打ちごっこ PWA',
				theme_color: '#FF6B35',
				background_color: '#f5f5f7',
				display: 'standalone',
				orientation: 'portrait',
				scope: '/',
				start_url: '/',
				id: '/',
				categories: ['entertainment', 'education'],
				icons: [
					{
						src: '/pwa-192x192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: '/pwa-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any'
					}
				]
			},
			devOptions: {
				enabled: true
			}
		})
	]
});
