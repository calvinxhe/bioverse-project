import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Login - Bioverse',
	description: 'Login to access the Bioverse questionnaire system',
};

export default function LoginLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			{children}
		</div>
	);
}