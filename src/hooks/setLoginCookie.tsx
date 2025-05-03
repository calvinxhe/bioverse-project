import { useCallback } from 'react';
import Cookies from 'js-cookie';

type SetLoginCookieProps = {
	rememberMe: boolean;
};

export const useSetLoginCookie = () => {
	return useCallback(({ rememberMe }: SetLoginCookieProps) => {
        // Create a cookie with readonly property for auth
		Cookies.set('isAuthenticated', 'true', {
			secure: true,
			sameSite: 'strict',
			expires: rememberMe ? 7 : undefined,
		});
	}, []);
};

export const useRemoveLoginCookie = () => {
	return useCallback(() => {
		Cookies.remove('isAuthenticated');
	}, []);
};

