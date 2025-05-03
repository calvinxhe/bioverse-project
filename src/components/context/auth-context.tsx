'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

interface AuthContextType {
	isAuthenticated: boolean;
	setIsAuthenticated: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const router = useRouter();

	useEffect(() => {
		const checkAuth = () => {
			const authCookie = Cookies.get('isAuthenticated');
			if (!authCookie) {
				router.push('/');
			} else {
				setIsAuthenticated(true);
			}
		};

		checkAuth();
	}, [router]);

	return (
		<AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}; 