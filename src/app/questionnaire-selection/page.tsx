'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Card,
	CardContent,
	Typography,
	Grid,
	Container,
	Button,
	CircularProgress,
	Alert,
} from '@mui/material';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Questionnaire {
	id: string;
	title: string;
	description: string | null;
}

export default function QuestionnaireSelection() {
	const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const router = useRouter();
	const supabase = createClientComponentClient();

	useEffect(() => {
		const fetchQuestionnaires = async () => {
			try {
				const { data, error: supabaseError } = await supabase
					.from('questionnaires')
					.select('id, title, description')
					.order('title');

				if (supabaseError) {
					console.error('Supabase error:', supabaseError);
					throw new Error(supabaseError.message);
				}

				if (!data) {
					throw new Error('No data returned from Supabase');
				}

				setQuestionnaires(data);
				setError(null);
			} catch (error) {
				console.error('Error fetching questionnaires:', error);
				setError(error instanceof Error ? error.message : 'Failed to fetch questionnaires');
			} finally {
				setLoading(false);
			}
		};

		fetchQuestionnaires();
	}, [supabase]);

	const handleQuestionnaireClick = (id: string) => {
		router.push(`/questionnaire/${id}`);
	};

	if (loading) {
		return (
			<Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
				<CircularProgress />
			</Container>
		);
	}

	if (error) {
		return (
			<Container sx={{ mt: 4 }}>
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
				<Button
					variant="contained"
					onClick={() => window.location.reload()}
					sx={{ mt: 2 }}
				>
					Retry
				</Button>
			</Container>
		);
	}

	return (
		<Container maxWidth="lg" sx={{ py: 4 }}>
			<Typography variant="h4" component="h1" gutterBottom>
				Select a Questionnaire
			</Typography>
			{questionnaires.length === 0 ? (
				<Alert severity="info">No questionnaires available.</Alert>
			) : (
				<Grid container spacing={3}>
					{questionnaires.map((questionnaire) => (
						<Grid key={questionnaire.id} sx={{ width: { xs: '100%', md: '50%' } }}>
							<Card
								sx={{
									height: '100%',
									display: 'flex',
									flexDirection: 'column',
									cursor: 'pointer',
									'&:hover': {
										boxShadow: 6,
									},
								}}
								onClick={() => handleQuestionnaireClick(questionnaire.id)}
							>
								<CardContent>
									<Typography variant="h5" component="h2" gutterBottom>
										{questionnaire.title}
									</Typography>
									{questionnaire.description && (
										<Typography variant="body1" color="text.secondary">
											{questionnaire.description}
										</Typography>
									)}
									<Button
										variant="contained"
										color="primary"
										sx={{ mt: 2 }}
										fullWidth
									>
										Start Questionnaire
									</Button>
								</CardContent>
							</Card>
						</Grid>
					))}
				</Grid>
			)}
		</Container>
	);
}
