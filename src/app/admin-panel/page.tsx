import { AuthProvider } from "@/components/context/auth-context";

export default function AdminPanel() {
	return (
		<AuthProvider>
			<div>Admin Panel</div>
		</AuthProvider>
	);
}
