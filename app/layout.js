import './globals.css'

export const metadata = {
  title: 'Ultimate Scanner Pro',
  description: 'Stock Scanner',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
