import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type UserAnswer = {
	id: string;
	answer: any;
	answeredAt: string;
	question: {
		question: string;
		type: string;
	};
};

type UserQuestionnaire = {
	id: string;
	userId: string;
	questionnaireId: string;
	status: string;
	startedAt: string;
	completedAt: string | null;
	lastUpdatedAt: string;
	questionnaire: {
		title: string;
		description: string | null;
	};
	answers: UserAnswer[];
};

export async function GET() {
	try {
		const cookieStore = cookies();
		const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

		// Fetch user questionnaires with their related data
		const { data: userQuestionnaires, error } = await supabase
			.from('user_questionnaires')
			.select(`
				*,
				questionnaire:questionnaires (
					title,
					description
				),
				answers:user_answers (
					id,
					answer,
					answeredAt,
					question:questions (
						question,
						type
					)
				)
			`)
			.order('lastUpdatedAt', { ascending: false });

		if (error) {
			console.error('Error fetching questionnaires:', error);
			return NextResponse.json(
				{ error: 'Failed to fetch questionnaires' },
				{ status: 500 }
			);
		}

		// Transform the data to match the frontend expectations
		const transformedData = (userQuestionnaires as UserQuestionnaire[]).map(q => ({
			...q,
			startedAt: q.startedAt,
			completedAt: q.completedAt,
			lastUpdatedAt: q.lastUpdatedAt,
			answers: q.answers.map((a: UserAnswer) => ({
				...a,
				answeredAt: a.answeredAt,
			})),
		}));

		return NextResponse.json(transformedData);
	} catch (error) {
		console.error('Error in admin questionnaires API:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
} 