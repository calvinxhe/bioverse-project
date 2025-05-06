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
	Checkbox,
} from '@mui/material';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { use } from 'react';
import { useAuth } from '@/components/context/auth-context';

interface Question {
	id: string;
	question: string;
	type: 'input' | 'mcq';
	options?: string[];
	isMany?: boolean;
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

interface UserQuestionnaire {
	id: string;
	status: string;
	is_complete: boolean;
	startedAt: string;
	completedAt: string | null;
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
	const [previousAttempts, setPreviousAttempts] = useState<UserQuestionnaire[]>([]);
	const router = useRouter();
	const supabase = createClientComponentClient();
	const { isAuthenticated, isAdmin } = useAuth();

	useEffect(() => {
		// Wait for auth state to be determined
		if (isAuthenticated === undefined) {
			return;
		}

		// Only redirect if we're certain about the auth state
		if (isAuthenticated === false) {
			router.push('/');
			return;
		}

		// Only redirect admin if we're certain about both auth and admin state
		if (isAuthenticated === true && isAdmin === true) {
			router.push('/admin-panel');
			return;
		}

		const fetchQuestionnaire = async () => {
			try {
				console.log('Fetching questionnaire with ID:', id);
				const response = await fetch(`/api/questionnaire/${id}`);
				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.error || 'Failed to fetch questionnaire');
				}

				console.log('Received questionnaire data:', data);
				// Log questions to check isMany field
				console.log('Questions with isMany:', data.questions.map((q: Question) => ({
					question: q.question,
					isMany: q.isMany,
					type: q.type
				})));
				setQuestionnaire(data);

				// Fetch all previous attempts
				const { data: attempts } = await supabase
					.from('user_questionnaires')
					.select('*')
					.eq('userId', DEMO_USER_ID)
					.eq('questionnaireId', id)
					.order('startedAt', { ascending: false });

				if (attempts) {
					setPreviousAttempts(attempts);
					// Check if the most recent attempt is complete
					if (attempts[0]?.is_complete) {
						setIsComplete(true);
					}

					// Fetch answers for the most recent attempt
					if (attempts[0]) {
						const { data: existingAnswers } = await supabase
							.from('user_answers')
							.select('questionId, answer')
							.eq('userQuestionnaireId', attempts[0].id);

						if (existingAnswers) {
							// Log existing answers to check their format
							console.log('Existing answers:', existingAnswers);
							setAnswers(
								existingAnswers.map((ans: any) => ({
									questionId: ans.questionId,
									answer: ans.answer,
								}))
							);
						}
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
	}, [id, supabase, isAuthenticated, isAdmin, router]);

	const startNewAttempt = async () => {
		try {
			setLoading(true);
			// Create a new attempt with a unique startedAt timestamp
			let newAttempt;
			const { data: attemptData, error: createError } = await supabase
				.from('user_questionnaires')
				.insert({
					userId: DEMO_USER_ID,
					questionnaireId: id,
					status: 'in_progress',
					is_complete: false,
					startedAt: new Date().toISOString(),
					lastUpdatedAt: new Date().toISOString(),
				})
				.select()
				.single();

			if (createError) {
				if (createError.code === '23505') {
					// If we get a unique constraint violation, try to update the existing record
					const { data: existingAttempt } = await supabase
						.from('user_questionnaires')
						.select('*')
						.eq('userId', DEMO_USER_ID)
						.eq('questionnaireId', id)
						.order('startedAt', { ascending: false })
						.limit(1)
						.single();

					if (existingAttempt) {
						// Update the existing attempt to start a new one
						const { data: updatedAttempt, error: updateError } = await supabase
							.from('user_questionnaires')
							.update({
								status: 'in_progress',
								is_complete: false,
								startedAt: new Date().toISOString(),
								lastUpdatedAt: new Date().toISOString(),
							})
							.eq('id', existingAttempt.id)
							.select()
							.single();

						if (updateError) throw updateError;
						newAttempt = updatedAttempt;
					} else {
						throw createError;
					}
				} else {
					throw createError;
				}
			} else {
				newAttempt = attemptData;
			}

			// Reset state for new attempt
			setAnswers([]);
			setIsComplete(false);
			// Update previousAttempts by replacing the existing attempt with the new one
			setPreviousAttempts(prev => {
				const filtered = prev.filter(attempt => attempt.id !== newAttempt.id);
				return [newAttempt, ...filtered];
			});
		} catch (error) {
			console.error('Error starting new attempt:', error);
			setError('Failed to start new attempt');
		} finally {
			setLoading(false);
		}
	};

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
				// Create new record using upsert to handle race conditions
				const { data: newQuestionnaire, error: createError } = await supabase
					.from('user_questionnaires')
					.upsert({
						userId: DEMO_USER_ID,
						questionnaireId: id,
						status: 'in_progress',
						is_complete: false,
						lastUpdatedAt: new Date().toISOString(),
					}, {
						onConflict: 'userId,questionnaireId'
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
		console.log('Handling answer change:', { questionId, value });
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
			// Get the current attempt
			const currentAttempt = previousAttempts[0];
			if (!currentAttempt) {
				throw new Error('No active attempt found');
			}

			console.log('Current attempt before update:', currentAttempt);

			// First update the status and is_complete
			const { data: statusUpdate, error: statusError } = await supabase
				.from('user_questionnaires')
				.update({
					status: 'completed',
					is_complete: true,
					completedAt: new Date().toISOString(),
					lastUpdatedAt: new Date().toISOString(),
				})
				.eq('id', currentAttempt.id)
				.select();

			if (statusError) {
				console.error('Error updating status:', statusError);
				throw statusError;
			}

			console.log('Status update result:', statusUpdate);

			// Verify the status update
			const { data: verifyStatus, error: verifyError } = await supabase
				.from('user_questionnaires')
				.select('*')
				.eq('id', currentAttempt.id)
				.single();

			if (verifyError) {
				console.error('Error verifying status:', verifyError);
			} else {
				console.log('Verified status:', verifyStatus);
			}

			// Save all answers
			const answerPromises = answers.map((answer) =>
				supabase.from('user_answers').upsert({
					userQuestionnaireId: currentAttempt.id,
					questionId: answer.questionId,
					answer: answer.answer,
				}, {
					onConflict: 'userQuestionnaireId,questionId'
				})
			);

			const answerResults = await Promise.all(answerPromises);
			const answerErrors = answerResults.filter(result => result.error);
			
			if (answerErrors.length > 0) {
				console.error('Errors saving answers:', answerErrors);
				throw new Error('Failed to save some answers');
			}

			// Update local state
			setIsComplete(true);
			setPreviousAttempts(prev => 
				prev.map(attempt => 
					attempt.id === currentAttempt.id 
						? { ...attempt, status: 'completed', is_complete: true }
						: attempt
				)
			);

			router.push('/questionnaire-selection');
		} catch (error) {
			console.error('Error submitting answers:', error);
			setError('Failed to submit answers');
		}
	};

	if (loading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (error || !questionnaire) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="error">{error || 'Questionnaire not found'}</Alert>
			</Box>
		);
	}

	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h4" component="h1" gutterBottom>
				{questionnaire.title}
			</Typography>
			{questionnaire.description && (
				<Typography variant="body1" color="text.secondary" paragraph>
					{questionnaire.description}
				</Typography>
			)}

			{previousAttempts.length > 0 && (
				<Box sx={{ mb: 3 }}>
					<Typography variant="h6" gutterBottom>
						Previous Attempts
					</Typography>
					{previousAttempts.map((attempt) => (
						<Paper 
							key={`${attempt.id}-${attempt.startedAt}`} 
							sx={{ p: 2, mb: 2 }}
						>
							<Typography>
								Started: {new Date(attempt.startedAt).toLocaleString()}
								{attempt.completedAt && ` • Completed: ${new Date(attempt.completedAt).toLocaleString()}`}
								{` • Status: ${attempt.status}`}
							</Typography>
						</Paper>
					))}
					{isComplete && (
						<Button
							variant="contained"
							color="primary"
							onClick={startNewAttempt}
							sx={{ mt: 2 }}
						>
							Start New Attempt
						</Button>
					)}
				</Box>
			)}

			{!isComplete && (
				<Box component="form" sx={{ mt: 4 }}>
					{questionnaire.questions.map((question, index) => {
						const existingAnswer = answers.find((a) => a.questionId === question.id);
						const currentValue = existingAnswer?.answer || (question.isMany ? [] : '');
						
						// Log question and current value for debugging
						console.log('Rendering question:', {
							id: question.id,
							question: question.question,
							isMany: question.isMany,
							currentValue,
							existingAnswer
						});

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
										value={currentValue}
										onChange={(e) => handleAnswerChange(question.id, e.target.value)}
										required
										placeholder="Type your answer here..."
									/>
								)}

								{question.type === 'mcq' && question.options && (
									<FormControl component="fieldset" fullWidth>
										{question.isMany ? (
											<Box>
												{question.options.map((option) => {
													const isChecked = Array.isArray(currentValue) && currentValue.includes(option);
													console.log('Checkbox state:', { option, isChecked, currentValue });
													return (
														<FormControlLabel
															key={option}
															control={
																<Checkbox
																	checked={isChecked}
																	onChange={(e) => {
																		const newValue = Array.isArray(currentValue) ? [...currentValue] : [];
																		if (e.target.checked) {
																			newValue.push(option);
																		} else {
																			const index = newValue.indexOf(option);
																			if (index > -1) {
																				newValue.splice(index, 1);
																			}
																		}
																		console.log('Checkbox change:', { option, newValue });
																		handleAnswerChange(question.id, newValue);
																	}}
																/>
															}
															label={option}
														/>
													);
												})}
											</Box>
										) : (
											<RadioGroup
												value={currentValue}
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
										)}
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
			)}

			<Snackbar
				open={showSaveMessage}
				autoHideDuration={3000}
				onClose={() => setShowSaveMessage(false)}
				message="Answers saved automatically"
			/>
		</Box>
	);
} 