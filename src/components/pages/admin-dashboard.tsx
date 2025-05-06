import { useState, useMemo } from 'react';
import {
	Box,
	Card,
	CardContent,
	Typography,
	useTheme,
	Button,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Divider,
	List,
	ListItem,
	ListItemText,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

type Answer = {
	id: string;
	userQuestionnaireId: string;
	questionId: string;
	answer: any;
	answeredAt: string;
	question: {
		type: string;
		question: string;
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
	is_complete: boolean;
	questionnaire: {
		title: string;
		description: string | null;
	};
	answers: Answer[];
};

type DashboardStats = {
	totalSubmissions: number;
	completeSubmissions: number;
	incompleteSubmissions: number;
};

export const AdminDashboard = () => {
	const theme = useTheme();
	const supabase = createClientComponentClient();
	const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<UserQuestionnaire | null>(null);

	// Fetch user questionnaires
	const { data: userQuestionnaires, isLoading } = useQuery<UserQuestionnaire[]>({
		queryKey: ['userQuestionnaires'],
		queryFn: async () => {
			const { data, error } = await supabase
				.from('user_questionnaires')
				.select(`
					*,
					questionnaire:questionnaires(*),
					answers:user_answers(
						*,
						question:questions(*)
					)
				`)
				.order('startedAt', { ascending: false });

			if (error) {
				throw new Error('Failed to fetch questionnaires');
			}

			return data as UserQuestionnaire[];
		},
	});

	// Calculate dashboard stats
	const stats = useMemo<DashboardStats>(() => {
		if (!userQuestionnaires) {
			return {
				totalSubmissions: 0,
				completeSubmissions: 0,
				incompleteSubmissions: 0,
			};
		}

		return {
			totalSubmissions: userQuestionnaires.length,
			completeSubmissions: userQuestionnaires.filter(q => q.is_complete).length,
			incompleteSubmissions: userQuestionnaires.filter(q => !q.is_complete).length,
		};
	}, [userQuestionnaires]);

	const getStatusDisplay = (questionnaire: UserQuestionnaire) => {
		const isComplete = questionnaire.is_complete;
		const hasAnswers = questionnaire.answers?.length > 0;
		
		let color = theme.palette.warning.light;
		let displayStatus = questionnaire.status;
		
		if (isComplete) {
			color = theme.palette.success.light;
			displayStatus = 'Completed';
		} else if (hasAnswers) {
			color = theme.palette.info.light;
			displayStatus = 'In Progress';
		} else {
			displayStatus = 'Not Started';
		}
		
		return { color, displayStatus };
	};

	const handleViewAnswers = (questionnaire: UserQuestionnaire) => {
		setSelectedQuestionnaire(questionnaire);
	};

	const handleCloseModal = () => {
		setSelectedQuestionnaire(null);
	};

	const formatAnswer = (answer: any, type: string) => {
		if (type === 'multiple_choice') {
			return Array.isArray(answer) ? answer.join(', ') : answer;
		}
		return answer?.toString() || 'No answer';
	};

	return (
		<Box sx={{ p: 3 }}>
			<Typography variant="h4" sx={{ mb: 4 }}>
				Admin Dashboard
			</Typography>

			{/* Stats Cards */}
			<Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
				<Card>
					<CardContent>
						<Typography color="textSecondary" gutterBottom>
							Total Submissions
						</Typography>
						<Typography variant="h4">
							{stats.totalSubmissions}
						</Typography>
					</CardContent>
				</Card>
				<Card>
					<CardContent>
						<Typography color="textSecondary" gutterBottom>
							Complete Submissions
						</Typography>
						<Typography variant="h4" color="success.main">
							{stats.completeSubmissions}
						</Typography>
					</CardContent>
				</Card>
				<Card>
					<CardContent>
						<Typography color="textSecondary" gutterBottom>
							Incomplete Submissions
						</Typography>
						<Typography variant="h4" color="warning.main">
							{stats.incompleteSubmissions}
						</Typography>
					</CardContent>
				</Card>
			</Box>

			{/* Submissions Table */}
			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Questionnaire</TableCell>
							<TableCell>User ID</TableCell>
							<TableCell>Status</TableCell>
							<TableCell>Started At</TableCell>
							<TableCell>Completed At</TableCell>
							<TableCell>Answers</TableCell>
							<TableCell>Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell colSpan={7} align="center">Loading...</TableCell>
							</TableRow>
						) : userQuestionnaires?.length === 0 ? (
							<TableRow>
								<TableCell colSpan={7} align="center">No submissions found</TableCell>
							</TableRow>
						) : (
							userQuestionnaires?.map((questionnaire) => {
								const { color, displayStatus } = getStatusDisplay(questionnaire);
								return (
									<TableRow key={questionnaire.id}>
										<TableCell>{questionnaire.questionnaire?.title || 'Unknown'}</TableCell>
										<TableCell>{questionnaire.userId}</TableCell>
										<TableCell>
											<Box
												sx={{
													backgroundColor: color,
													borderRadius: '4px',
													padding: '4px 8px',
													display: 'inline-block',
												}}
											>
												{displayStatus}
											</Box>
										</TableCell>
										<TableCell>
											{questionnaire.startedAt ? new Date(questionnaire.startedAt).toLocaleString() : '-'}
										</TableCell>
										<TableCell>
											{questionnaire.completedAt ? new Date(questionnaire.completedAt).toLocaleString() : '-'}
										</TableCell>
										<TableCell>{questionnaire.answers?.length || 0}</TableCell>
										<TableCell>
											<Button
												variant="contained"
												size="small"
												onClick={() => handleViewAnswers(questionnaire)}
											>
												View Answers
											</Button>
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</TableContainer>

			{/* Answers Modal */}
			<Dialog
				open={!!selectedQuestionnaire}
				onClose={handleCloseModal}
				maxWidth="md"
				fullWidth
			>
				{selectedQuestionnaire && (
					<>
						<DialogTitle>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<Typography variant="h6">
									{selectedQuestionnaire.questionnaire?.title || 'Unknown Questionnaire'}
								</Typography>
								<Typography variant="body2" color="textSecondary">
									Submitted: {new Date(selectedQuestionnaire.startedAt).toLocaleString()}
								</Typography>
							</Box>
						</DialogTitle>
						<DialogContent>
							<Box sx={{ mt: 2 }}>
								<Typography variant="subtitle1" gutterBottom>
									User ID: {selectedQuestionnaire.userId}
								</Typography>
								<Divider sx={{ my: 2 }} />
								<List>
									{selectedQuestionnaire.answers.map((answer) => (
										<ListItem key={answer.id} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
											<ListItemText
												primary={answer.question.question}
												secondary={
													<Box sx={{ mt: 1 }}>
														<Typography variant="body2" color="textSecondary">
															Answer: {formatAnswer(answer.answer, answer.question.type)}
														</Typography>
														<Typography variant="caption" color="textSecondary">
															Answered: {new Date(answer.answeredAt).toLocaleString()}
														</Typography>
													</Box>
												}
											/>
										</ListItem>
									))}
								</List>
							</Box>
						</DialogContent>
						<DialogActions>
							<Button onClick={handleCloseModal}>Close</Button>
						</DialogActions>
					</>
				)}
			</Dialog>
		</Box>
	);
}; 