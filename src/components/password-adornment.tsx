'use client';

// copied from material-ui docs

import React from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Input from '@mui/material/Input';
import FilledInput from '@mui/material/FilledInput';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import FormHelperText from '@mui/material/FormHelperText';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function InputWithIcon({ register, error, helperText }: { 
	register: any;
	error?: boolean;
	helperText?: string;
}) {
	const [showPassword, setShowPassword] = React.useState(false);

	const handleClickShowPassword = () => setShowPassword((show) => !show);
  
	const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
	};
  
	const handleMouseUpPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
		event.preventDefault();
	};

	return (
		<TextField
			sx={{ width: '100%', mb: 2 }}
			variant="outlined"
			label="Password"
			fullWidth
			type={showPassword ? 'text' : 'password'}
			error={error}
			helperText={helperText}
			{...register('password')}
			InputProps={{
				endAdornment: (
					<InputAdornment position="end">
						<IconButton
							aria-label={showPassword ? 'hide the password' : 'display the password'}
							onClick={handleClickShowPassword}
							onMouseDown={handleMouseDownPassword}
							onMouseUp={handleMouseUpPassword}
							edge="end"
						>
							{showPassword ? <VisibilityOff /> : <Visibility />}
						</IconButton>
					</InputAdornment>
				)
			}}
		/>
	);
}