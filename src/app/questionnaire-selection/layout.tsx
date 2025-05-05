import type { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Questionnaire Selection - Bioverse',
	description: 'Select a questionnaire to begin',
};

export default function QuestionnaireSelectionLayout({
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