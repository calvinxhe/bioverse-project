import { useCallback } from 'react';
import Cookies from 'js-cookie';

export type adminLoginProps = {
	username: string;
	password: string;
	rememberMe: boolean;
};

export const useSetLoginCookie = (adminLogin: adminLoginProps) => {
	return useCallback(() => {
        if (adminLogin.username === 'admin' && adminLogin.password === 'admin123') {
            // Create a cookie with readonly property for auth
            Cookies.set('isAuthenticated', 'true', {
                secure: true,
                sameSite: 'strict',
                expires: adminLogin.rememberMe ? 7 : undefined,
            });
            // Set admin status cookie
            Cookies.set('isAdmin', 'true', {
                secure: true,
                sameSite: 'strict',
                expires: adminLogin.rememberMe ? 7 : undefined,
            });
        } else {
            // For non-admin users, only set authentication
            Cookies.set('isAuthenticated', 'true', {
                secure: true,
                sameSite: 'strict',
                expires: adminLogin.rememberMe ? 7 : undefined,
            });
            Cookies.set('isAdmin', 'false', {
                secure: true,
                sameSite: 'strict',
                expires: adminLogin.rememberMe ? 7 : undefined,
            });
        }
	}, [adminLogin]);
};

export const useRemoveLoginCookie = () => {
	return useCallback(() => {
		Cookies.remove('isAuthenticated');
		Cookies.remove('isAdmin');
	}, []);
};

