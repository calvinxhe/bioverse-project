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
	FormControlLabel,
	Checkbox,
	InputAdornment,
	IconButton,
	Tooltip,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useSetLoginCookie } from '@/hooks/setLoginCookie';
import InputWithIcon from '../password-adornment';
import type { adminLoginProps } from '@/hooks/setLoginCookie';

const loginSchema = z.object({
	username: z.string().min(1, 'Username is required'),
	password: z.string().min(1, 'Password is required'),
	rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
	const router = useRouter();
	const [error, setError] = useState<string>('');
	const usernameRef = useRef<HTMLInputElement>(null);
	const [loginData, setLoginData] = useState<adminLoginProps | null>(null);
	const setLoginCookie = useSetLoginCookie(loginData || { username: '', password: '', rememberMe: false });

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
	});

	const onSubmit = async (data: LoginFormData) => {
		try {
			setLoginData({
				username: data.username,
				password: data.password,
				rememberMe: data.rememberMe || false
			});

			if (data.username === 'admin' && data.password === 'admin123') {
				setLoginCookie();
				router.push('/admin-panel');
			} else if (data.username === 'user' && data.password === 'user123') {
				setLoginCookie();
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
						<Tooltip title="For admin use username: 'admin' and password: 'admin123'. For user use username: 'user' and password: 'user123'.">
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
						</Tooltip>

						<InputWithIcon 
							aria-label="Password"
							register={register}
							error={!!errors.password}
							helperText={errors.password?.message}
						/>

						<FormControlLabel
							control={<Checkbox {...register('rememberMe')} />}
							label="Remember me"
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