import './globals.css'
import { Analytics } from "@vercel/analytics/react"
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-sans',
})

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
})

export const metadata: Metadata = {
    title: 'GitPainter - GitHub Commit Art',
    description: 'Design and deploy stunning GitHub contribution graphs.',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="fr" className={`${inter.variable} ${jetbrainsMono.variable}`}>
            <body className="font-sans antialiased">
                {children}
                <Analytics />
            </body>
        </html>
    )
}
