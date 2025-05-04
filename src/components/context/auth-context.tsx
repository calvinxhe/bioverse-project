'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

interface AuthContextType {
	isAuthenticated: boolean;
	setIsAuthenticated: (value: boolean) => void;
	checkAuth: () => { isAuthenticated: boolean; isAdmin: boolean };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const router = useRouter();

	const checkAuth = useCallback(() => {
		const authCookie = Cookies.get('isAuthenticated');
		const adminCookie = Cookies.get('isAdmin');
		return {
			isAuthenticated: !!authCookie,
			isAdmin: !!adminCookie
		};
	}, [router]);

	useEffect(() => {
		const checkAuthStatus = () => {
			const authCookie = Cookies.get('isAuthenticated');
			if (!authCookie) {
				router.push('/');
			} else {
				setIsAuthenticated(true);
			}
		};

		checkAuthStatus();
	}, [router]);

	return (
		<AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, checkAuth }}>
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