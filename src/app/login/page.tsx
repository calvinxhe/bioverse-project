'use client';

import { Box, Paper, Typography } from '@mui/material';
import LoginForm from '@/components/pages/login-page';

export default function Login() {
	return (
		<Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
			<Paper sx={{ p: 4, maxWidth: 400, width: '100%' }}>
				<Typography variant="h4" component="h1" gutterBottom align="center">
					Login
				</Typography>
				<LoginForm />
			</Paper>
		</Box>
	);
}
