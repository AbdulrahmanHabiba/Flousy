import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'فلوسي | السجل الشخصي',description:'دفترك المالي، على طريقتك',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ar" dir="rtl"><body>{children}</body></html>;}
