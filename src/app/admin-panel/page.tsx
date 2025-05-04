'use client';

import { AuthProvider, useAuth } from '@/components/context/auth-context';
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from '@/components/sidebar';

function AdminPanelContent() {
	const { checkAuth } = useAuth();
	const router = useRouter();

	useEffect(() => {
		const { isAdmin } = checkAuth();
		if (!isAdmin) {
			router.push('/');
		}
	}, [checkAuth, router]);

	return (
		<>
			<Sidebar isAdmin={true} />

		</>
	);
}

const AdminPanel = () => {
	return (
		<AuthProvider>
			<AdminPanelContent />
		</AuthProvider>
	);
};

export default AdminPanel;
