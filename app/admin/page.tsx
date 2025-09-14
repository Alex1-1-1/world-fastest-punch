import React from 'react';
import { Metadata } from 'next';
import AdminDashboard from '@/components/admin/AdminDashboard';

export const metadata: Metadata = {
  title: '管理者ダッシュボード - 世界一速いパンチ',
  description: '投稿の判定と管理を行う管理者用ダッシュボード',
};

export default function AdminPage() {
  return <AdminDashboard />;
}



