import './globals.css';
import { Outfit } from 'next/font/google';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata = {
  title: 'eyeSpeak',
  description: 'Eye-gaze communication for stroke and paralysis patients',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="relative min-h-screen bg-slate-950 font-sans text-white antialiased">
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
          <div className="absolute -left-32 -top-32 h-[26rem] w-[26rem] animate-blob rounded-full bg-cyan-500/30 blur-3xl" />
          <div
            className="absolute right-[-8rem] top-1/4 h-[30rem] w-[30rem] animate-blob rounded-full bg-violet-600/30 blur-3xl"
            style={{ animationDelay: '4s' }}
          />
          <div
            className="absolute bottom-[-6rem] left-1/3 h-[26rem] w-[26rem] animate-blob rounded-full bg-rose-500/20 blur-3xl"
            style={{ animationDelay: '8s' }}
          />
          <div className="absolute inset-0 bg-slate-950/35" />
        </div>
        {children}
      </body>
    </html>
  );
}
