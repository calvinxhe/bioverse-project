'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
	isAuthenticated: boolean;
	isAdmin: boolean;
	setIsAuthenticated: (value: boolean) => void;
	setIsAdmin: (value: boolean) => void;
	checkAuth: () => { isAuthenticated: boolean; isAdmin: boolean };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ['/', '/login'];

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);
	const router = useRouter();
	const pathname = usePathname();

	const checkAuth = useCallback(() => {
		const authCookie = Cookies.get('isAuthenticated');
		const adminCookie = Cookies.get('isAdmin');
		return {
			isAuthenticated: !!authCookie,
			isAdmin: adminCookie === 'true'
		};
	}, []);

	useEffect(() => {
		const checkAuthStatus = () => {
			// Skip auth check for public paths
			if (PUBLIC_PATHS.includes(pathname || '')) {
				return;
			}

			const { isAuthenticated: auth, isAdmin: admin } = checkAuth();
			
			if (!auth) {
				router.push('/');
				return;
			}

			// Update state based on cookies
			setIsAuthenticated(true);
			setIsAdmin(admin);

			// Handle route protection
			if (pathname?.startsWith('/admin-panel')) {
				if (!admin) {
					router.push('/questionnaire-selection');
					return;
				}
			} else if (pathname?.startsWith('/questionnaire-selection')) {
				if (admin) {
					router.push('/admin-panel');
					return;
				}
			} else if (pathname?.startsWith('/questionnaire/')) {
				// Allow access to questionnaire pages for authenticated users
				if (!auth) {
					router.push('/');
					return;
				}
			} else if (auth && !PUBLIC_PATHS.includes(pathname || '')) {
				// If authenticated but on an unknown route, redirect based on role
				if (admin) {
					router.push('/admin-panel');
				} else {
					router.push('/questionnaire-selection');
				}
			}
		};

		checkAuthStatus();
	}, [router, pathname, checkAuth]);

	return (
		<AuthContext.Provider value={{ isAuthenticated, isAdmin, setIsAuthenticated, setIsAdmin, checkAuth }}>
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