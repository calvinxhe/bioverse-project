import { useCallback } from 'react';
import Cookies from 'js-cookie';

export const useSetLoginCookie = () => {
	return useCallback(() => {
        // Create a cookie with readonly property for auth
		Cookies.set('isAuthenticated', 'true', {
			secure: true,
			sameSite: 'strict',
			expires: 7, // 7 days
		});
	}, []);
};
