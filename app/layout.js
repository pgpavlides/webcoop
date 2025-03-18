import './globals.css';
import AuthProvider from './components/AuthProvider';

export const metadata = {
  title: 'WebCoop - Website Feedback Tool',
  description: 'Collaborative feedback tool for web projects',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
