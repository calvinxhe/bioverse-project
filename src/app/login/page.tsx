'use client';

import { Box, Paper, Typography } from '@mui/material';
import LoginForm from '@/components/pages/login-page';

export default function Login() {
	return (
		<Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
				<LoginForm />
		</Box>
	);
}
