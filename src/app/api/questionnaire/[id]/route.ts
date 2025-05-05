import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
	request: Request,
	{ params }: { params: { id: string } }
) {
	try {
		const supabase = createRouteHandlerClient({ cookies });

		// Fetch questionnaire and its questions
		const { data: questionnaire, error: questionnaireError } = await supabase
			.from('questionnaires')
			.select(`
				*,
				questionnaire_questions (
					questionId,
					questions (
						id,
						question,
						type,
						options
					)
				)
			`)
			.eq('id', params.id)
			.single();

		if (questionnaireError) {
			console.error('Error fetching questionnaire:', questionnaireError);
			return NextResponse.json(
				{ error: 'Failed to fetch questionnaire' },
				{ status: 500 }
			);
		}

		if (!questionnaire) {
			return NextResponse.json(
				{ error: 'Questionnaire not found' },
				{ status: 404 }
			);
		}

		// Transform the data to match the expected format
		const transformedData = {
			...questionnaire,
			questions: questionnaire.questionnaire_questions
				.map((qq: any) => qq.questions)
				.filter(Boolean),
		};

		return NextResponse.json(transformedData);
	} catch (error) {
		console.error('Error in questionnaire API:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
} 