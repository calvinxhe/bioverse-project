'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
	const router = useRouter();

	useEffect(() => {
		const timer = setTimeout(() => {
			router.push('/');
		}, 3000);

		return () => clearTimeout(timer);
	}, [router]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="text-center">
				<h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
				<p className="text-lg text-gray-600">The page you are looking for does not exist.</p>
				<p className="text-sm text-gray-500 mt-2">Redirecting to home page...</p>
			</div>
		</div>
	);
} 