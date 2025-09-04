import './global.css'

export const metadata = {
  title: 'Ultimate Scanner Pro',
  description: 'Advanced Stock Scanner with ML Trading System',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        {children}
      </body>
    </html>
  )
}
