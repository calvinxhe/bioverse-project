'use client';

import { Box, Typography, Button } from '@mui/material';
import Link from 'next/link';

export default function Home() {
	return (
		<Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
			<Typography variant="h2" component="h1" gutterBottom>
				Welcome to Bioverse
			</Typography>
			<Typography variant="h5" color="text.secondary" paragraph>
				Your platform for the future of longevity
			</Typography>
			<Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
				<Button
					component={Link}
					href="/login"
					variant="contained"
					color="primary"
					size="large"
				>
					Get Started
				</Button>
			</Box>
		</Box>
	);
}
