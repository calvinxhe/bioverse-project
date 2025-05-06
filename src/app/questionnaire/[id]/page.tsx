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
	Radio,
	RadioGroup,
	Alert,
	Snackbar,
} from '@mui/material';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { use } from 'react';

interface Question {
	id: string;
	question: string;
	type: 'input' | 'mcq';
	options?: string[];
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

// Fixed demo user ID for development
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000';

export default function QuestionnairePage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = use(params);
	const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
	const [answers, setAnswers] = useState<Answer[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isComplete, setIsComplete] = useState(false);
	const [saving, setSaving] = useState(false);
	const [showSaveMessage, setShowSaveMessage] = useState(false);
	const router = useRouter();
	const supabase = createClientComponentClient();

	useEffect(() => {
		const fetchQuestionnaire = async () => {
			try {
				console.log('Fetching questionnaire with ID:', id);
				const response = await fetch(`/api/questionnaire/${id}`);
				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.error || 'Failed to fetch questionnaire');
				}

				console.log('Received questionnaire data:', data);
				setQuestionnaire(data);

				// Check if questionnaire is already completed
				const { data: userQuestionnaire } = await supabase
					.from('user_questionnaires')
					.select('id, is_complete')
					.eq('userId', DEMO_USER_ID)
					.eq('questionnaireId', id)
					.single();

				if (userQuestionnaire?.is_complete) {
					setIsComplete(true);
				}

				// Fetch existing answers if any
				if (userQuestionnaire) {
					const { data: existingAnswers } = await supabase
						.from('user_answers')
						.select('questionId, answer')
						.eq('userQuestionnaireId', userQuestionnaire.id);

					if (existingAnswers) {
						setAnswers(
							existingAnswers.map((ans: any) => ({
								questionId: ans.questionId,
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

	const saveAnswers = async (newAnswers: Answer[]) => {
		try {
			setSaving(true);
			
			// First check if a user questionnaire record exists
			const { data: existingUserQuestionnaire } = await supabase
				.from('user_questionnaires')
				.select('id')
				.eq('userId', DEMO_USER_ID)
				.eq('questionnaireId', id)
				.single();

			let userQuestionnaireId;

			if (existingUserQuestionnaire) {
				// Update existing record
				const { data: updatedQuestionnaire, error: updateError } = await supabase
					.from('user_questionnaires')
					.update({
						status: 'in_progress',
						is_complete: false,
						lastUpdatedAt: new Date().toISOString(),
					})
					.eq('id', existingUserQuestionnaire.id)
					.select()
					.single();

				if (updateError) throw updateError;
				userQuestionnaireId = updatedQuestionnaire.id;
			} else {
				// Create new record
				const { data: newQuestionnaire, error: createError } = await supabase
					.from('user_questionnaires')
					.insert({
						userId: DEMO_USER_ID,
						questionnaireId: id,
						status: 'in_progress',
						is_complete: false,
					})
					.select()
					.single();

				if (createError) throw createError;
				userQuestionnaireId = newQuestionnaire.id;
			}

			// Save all answers using upsert with the correct unique key fields
			const { error: upsertError } = await supabase
				.from('user_answers')
				.upsert(
					newAnswers.map((answer) => ({
						userQuestionnaireId,
						questionId: answer.questionId,
						answer: answer.answer,
					})),
					{
						onConflict: 'userQuestionnaireId,questionId'
					}
				);

			if (upsertError) throw upsertError;
			setShowSaveMessage(true);
		} catch (error) {
			console.error('Error saving answers:', error);
			setError('Failed to save answers');
		} finally {
			setSaving(false);
		}
	};

	const handleAnswerChange = (questionId: string, value: string | string[]) => {
		setAnswers((prev) => {
			const existingAnswerIndex = prev.findIndex((a) => a.questionId === questionId);
			const newAnswers = existingAnswerIndex >= 0
				? prev.map((a, index) => index === existingAnswerIndex ? { questionId, answer: value } : a)
				: [...prev, { questionId, answer: value }];
			
			// Auto-save after a short delay
			const timeoutId = setTimeout(() => {
				saveAnswers(newAnswers);
			}, 1000);

			return newAnswers;
		});
	};

	const handleSubmit = async () => {
		try {
			// Create or update user questionnaire
			const { data: userQuestionnaire, error: userQuestionnaireError } = await supabase
				.from('user_questionnaires')
				.upsert({
					userId: DEMO_USER_ID,
					questionnaireId: id,
					status: 'completed',
					completedAt: new Date().toISOString(),
					is_complete: true,
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
			setIsComplete(true);
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

			{isComplete && (
				<Alert severity="success" sx={{ mb: 3 }}>
					You have already completed this questionnaire. You can submit it again if you wish.
				</Alert>
			)}

			<Box component="form" sx={{ mt: 4 }}>
				{questionnaire.questions.map((question, index) => {
					const existingAnswer = answers.find((a) => a.questionId === question.id);

					return (
						<Paper key={question.id} sx={{ p: 3, mb: 3 }}>
							<Typography variant="h6" gutterBottom>
								{index + 1}. {question.question}
							</Typography>

							{question.type === 'input' && (
								<TextField
									fullWidth
									multiline
									rows={4}
									value={existingAnswer?.answer || ''}
									onChange={(e) => handleAnswerChange(question.id, e.target.value)}
									required
									placeholder="Type your answer here..."
								/>
							)}

							{question.type === 'mcq' && question.options && (
								<FormControl component="fieldset" fullWidth>
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
						</Paper>
					);
				})}

				<Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
					<Button
						variant="contained"
						color="primary"
						onClick={handleSubmit}
						disabled={answers.length === 0 || saving}
					>
						{saving ? 'Saving...' : 'Submit Answers'}
					</Button>
				</Box>
			</Box>

			<Snackbar
				open={showSaveMessage}
				autoHideDuration={3000}
				onClose={() => setShowSaveMessage(false)}
				message="Answers saved automatically"
			/>
		</Container>
	);
} 