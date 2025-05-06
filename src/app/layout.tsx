import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AuthProvider } from '@/components/context/auth-context';
import { Box } from '@mui/material';
import ClientLayout from '@/components/layout/client-layout';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Bioverse Questionnaire System",
	description: "A questionnaire system for Bioverse",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<Providers>
					<AuthProvider>
						<ClientLayout>
							{children}
						</ClientLayout>
					</AuthProvider>
				</Providers>
			</body>
		</html>
	);
}
