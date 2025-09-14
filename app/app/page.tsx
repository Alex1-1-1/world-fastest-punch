import React from 'react';
import { Metadata } from 'next';
import WebApp from '@/components/WebApp';

export const metadata: Metadata = {
  title: 'アプリ - 世界一速いパンチ',
  description: 'パンチの速さを競い合うアプリ',
};

export default function AppPage() {
  return <WebApp />;
}



