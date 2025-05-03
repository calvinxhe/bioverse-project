'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
	Box,
	Button,
	Container,
	TextField,
	Typography,
	Paper,
} from '@mui/material';

const loginSchema = z.object({
	username: z.string().min(1, 'Username is required'),
	password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
	const router = useRouter();
	const [error, setError] = useState<string>('');
	const usernameRef = useRef<HTMLInputElement>(null);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
	});

	const onSubmit = async (data: LoginFormData) => {
		try {
			if (data.username === 'admin' && data.password === 'admin123') {
				router.push('/admin-panel');
			} else if (data.username === 'user' && data.password === 'user123') {
				router.push('/questionnaire-selection');
			} else {
				setError('Invalid username or password');
			}
		} catch (err) {
			setError('An error occurred during login');
		}
	};

	return (
		<Container maxWidth="sm">
			<Box
				sx={{
					minHeight: '100vh',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<Paper
					elevation={3}
					sx={{
						p: 4,
						width: '100%',
						maxWidth: 400,
					}}
				>
					<Typography variant="h4" component="h1" gutterBottom align="center">
						Login
					</Typography>
					
					{error && (
						<Typography color="error" align="center" sx={{ mb: 2 }}>
							{error}
						</Typography>
					)}

					<form onSubmit={handleSubmit(onSubmit)}>
						<TextField
							fullWidth
							label="Username"
							variant="outlined"
							error={!!errors.username}
							helperText={errors.username?.message}
							inputRef={usernameRef}
							{...register('username')}
							sx={{ mb: 2 }}
							aria-label="Username"
						/>

						<TextField
							fullWidth
							label="Password"
							type="password"
							variant="outlined"
							error={!!errors.password}
							helperText={errors.password?.message}
							{...register('password')}
							sx={{ mb: 2 }}
						/>

						<Button
							type="submit"
							variant="contained"
							fullWidth
							sx={{ mt: 3 }}
						>
							Login
						</Button>
					</form>
				</Paper>
			</Box>
		</Container>
	);
} 