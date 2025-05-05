'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Container,
	Typography,
	Paper,
	Box,
	Button,
	CircularProgress,
	TextField,
	FormControl,
	FormControlLabel,
	Checkbox,
	Radio,
	RadioGroup,
	FormLabel,
	Alert,
} from '@mui/material';
import { createClient } from '@supabase/supabase-js';
import { use } from 'react';

interface Question {
	id: string;
	question: string;
	type: string;
	options: string[] | null;
}

interface Questionnaire {
	id: string;
	title: string;
	description: string | null;
	questions: Question[];
}

interface Answer {
	questionId: string;
	answer: string | string[];
}

export default function QuestionnairePage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
	const [answers, setAnswers] = useState<Answer[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();
	const supabase = createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
	);

	useEffect(() => {
		const fetchQuestionnaire = async () => {
			try {
				// Fetch questionnaire with its questions
				const { data: questionnaireData, error: questionnaireError } = await supabase
					.from('questionnaires')
					.select(`
						*,
						questions:questionnaire_questions(
							question:questions(*)
						)
					`)
					.eq('id', id)
					.single();

				if (questionnaireError) throw questionnaireError;

				// Transform the data to match our interface
				const transformedData = {
					...questionnaireData,
					questions: questionnaireData.questions.map((q: any) => q.question),
				};

				setQuestionnaire(transformedData);

				// Fetch existing answers if any
				const { data: userData } = await supabase.auth.getUser();
				if (userData.user) {
					const { data: existingAnswers } = await supabase
						.from('user_answers')
						.select('*')
						.eq('user_id', userData.user.id);

					if (existingAnswers) {
						setAnswers(
							existingAnswers.map((ans: any) => ({
								questionId: ans.question_id,
								answer: ans.answer,
							}))
						);
					}
				}
			} catch (error) {
				console.error('Error fetching questionnaire:', error);
				setError('Failed to load questionnaire');
			} finally {
				setLoading(false);
			}
		};

		fetchQuestionnaire();
	}, [id, supabase]);

	const handleAnswerChange = (questionId: string, value: string | string[]) => {
		setAnswers((prev) => {
			const existingAnswerIndex = prev.findIndex((a) => a.questionId === questionId);
			if (existingAnswerIndex >= 0) {
				const newAnswers = [...prev];
				newAnswers[existingAnswerIndex] = { questionId, answer: value };
				return newAnswers;
			}
			return [...prev, { questionId, answer: value }];
		});
	};

	const handleSubmit = async () => {
		try {
			const { data: userData } = await supabase.auth.getUser();
			if (!userData.user) throw new Error('User not authenticated');

			// Create or update user questionnaire
			const { data: userQuestionnaire, error: userQuestionnaireError } = await supabase
				.from('user_questionnaires')
				.upsert({
					userId: userData.user.id,
					questionnaireId: id,
					status: 'completed',
					completedAt: new Date().toISOString(),
				})
				.select()
				.single();

			if (userQuestionnaireError) throw userQuestionnaireError;

			// Save all answers
			const answerPromises = answers.map((answer) =>
				supabase.from('user_answers').upsert({
					userQuestionnaireId: userQuestionnaire.id,
					questionId: answer.questionId,
					answer: answer.answer,
				})
			);

			await Promise.all(answerPromises);
			router.push('/questionnaire-selection');
		} catch (error) {
			console.error('Error submitting answers:', error);
			setError('Failed to submit answers');
		}
	};

	if (loading) {
		return (
			<Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
				<CircularProgress />
			</Container>
		);
	}

	if (error || !questionnaire) {
		return (
			<Container sx={{ mt: 4 }}>
				<Alert severity="error">{error || 'Questionnaire not found'}</Alert>
			</Container>
		);
	}

	return (
		<Container maxWidth="md" sx={{ py: 4 }}>
			<Typography variant="h4" component="h1" gutterBottom>
				{questionnaire.title}
			</Typography>
			{questionnaire.description && (
				<Typography variant="body1" color="text.secondary" paragraph>
					{questionnaire.description}
				</Typography>
			)}

			<Box component="form" sx={{ mt: 4 }}>
				{questionnaire.questions.map((question, index) => {
					const existingAnswer = answers.find((a) => a.questionId === question.id);

					return (
						<Paper key={question.id} sx={{ p: 3, mb: 3 }}>
							<Typography variant="h6" gutterBottom>
								{index + 1}. {question.question}
							</Typography>

							{question.type === 'text' && (
								<TextField
									fullWidth
									multiline
									rows={4}
									value={existingAnswer?.answer || ''}
									onChange={(e) => handleAnswerChange(question.id, e.target.value)}
									required
								/>
							)}

							{question.type === 'radio' && question.options && (
								<FormControl component="fieldset">
									<RadioGroup
										value={existingAnswer?.answer || ''}
										onChange={(e) => handleAnswerChange(question.id, e.target.value)}
									>
										{question.options.map((option) => (
											<FormControlLabel
												key={option}
												value={option}
												control={<Radio />}
												label={option}
											/>
										))}
									</RadioGroup>
								</FormControl>
							)}

							{question.type === 'checkbox' && question.options && (
								<FormControl component="fieldset">
									<FormLabel component="legend">Select all that apply</FormLabel>
									{question.options.map((option) => (
										<FormControlLabel
											key={option}
											control={
												<Checkbox
													checked={
														Array.isArray(existingAnswer?.answer)
															? existingAnswer.answer.includes(option)
															: false
													}
													onChange={(e) => {
														const currentAnswers = Array.isArray(existingAnswer?.answer)
															? existingAnswer.answer
															: [];
														const newAnswers = e.target.checked
															? [...currentAnswers, option]
															: currentAnswers.filter((a) => a !== option);
														handleAnswerChange(question.id, newAnswers);
													}}
												/>
											}
											label={option}
										/>
									))}
								</FormControl>
							)}
						</Paper>
					);
				})}

				<Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
					<Button
						variant="contained"
						color="primary"
						onClick={handleSubmit}
						disabled={answers.length === 0}
					>
						Submit Answers
					</Button>
				</Box>
			</Box>
		</Container>
	);
} 