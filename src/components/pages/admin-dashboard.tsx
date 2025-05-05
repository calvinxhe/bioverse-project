import { useState, useMemo } from 'react';
import {
	Box,
	Card,
	CardContent,
	Typography,
	useTheme,
	Button,
} from '@mui/material';
import { DataGrid, type GridColDef, type GridRenderCellParams, type GridValueGetterParams } from '@mui/x-data-grid';
import { useQuery } from '@tanstack/react-query';

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
	};
	answers: Array<{
		questionId: string;
		answer: any;
		answeredAt: string;
		question: {
			question: string;
		};
	}>;
};

type DashboardStats = {
	totalSubmissions: number;
	completeSubmissions: number;
	incompleteSubmissions: number;
};

export const AdminDashboard = () => {
	const theme = useTheme();

	// Fetch user questionnaires
	const { data: userQuestionnaires, isLoading } = useQuery<UserQuestionnaire[]>({
		queryKey: ['userQuestionnaires'],
		queryFn: async () => {
			const response = await fetch('/api/admin/questionnaires');
			if (!response.ok) {
				throw new Error('Failed to fetch questionnaires');
			}
			return response.json();
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
			completeSubmissions: userQuestionnaires.filter(q => q.status === 'completed').length,
			incompleteSubmissions: userQuestionnaires.filter(q => q.status !== 'completed').length,
		};
	}, [userQuestionnaires]);

	// Define columns for the table
	const columns: GridColDef<UserQuestionnaire>[] = [
		{
			field: 'questionnaire.title',
			headerName: 'Questionnaire',
			width: 200,
			valueGetter: (params: GridValueGetterParams<UserQuestionnaire>) => params.row.questionnaire.title,
		},
		{
			field: 'userId',
			headerName: 'User ID',
			width: 150,
		},
		{
			field: 'status',
			headerName: 'Status',
			width: 120,
			renderCell: (params: GridRenderCellParams<UserQuestionnaire>) => (
				<Box
					sx={{
						backgroundColor:
							params.value === 'completed'
								? theme.palette.success.light
								: theme.palette.warning.light,
						borderRadius: '4px',
						padding: '4px 8px',
						display: 'inline-block',
					}}
				>
					{params.value}
				</Box>
			),
		},
		{
			field: 'startedAt',
			headerName: 'Started At',
			width: 150,
			valueGetter: (params: GridValueGetterParams<UserQuestionnaire>) => new Date(params.value).toLocaleString(),
		},
		{
			field: 'completedAt',
			headerName: 'Completed At',
			width: 150,
			valueGetter: (params: GridValueGetterParams<UserQuestionnaire>) => params.value ? new Date(params.value).toLocaleString() : '-',
		},
		{
			field: 'actions',
			headerName: 'Actions',
			width: 120,
			renderCell: (params: GridRenderCellParams<UserQuestionnaire>) => (
				<Button
					variant="contained"
					size="small"
					onClick={() => {
						// Handle view answers
						console.log('View answers for:', params.row);
					}}
				>
					View Answers
				</Button>
			),
		},
	];

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
			<Box sx={{ height: 400, width: '100%' }}>
				<DataGrid
					rows={userQuestionnaires || []}
					columns={columns}
					loading={isLoading}
					disableRowSelectionOnClick
				/>
			</Box>
		</Box>
	);
}; 