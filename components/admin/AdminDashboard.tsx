'use client';

import React, { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ImageIcon, Trophy, Flag, Users, Clock, CheckCircle, XCircle, AlertCircle, LogOut } from 'lucide-react';

interface Submission {
  id: string;
  imageUrl: string;
  thumbnailUrl: string;
  watermarkedUrl?: string;
  speed?: number;
  comment?: string;
  description?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  user: {
    name?: string;
    email?: string;
  };
  reports?: Report[];
}

interface Report {
  id: string;
  reason: string;
  description?: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  reporter: {
    name?: string;
  };
}

interface AdminDashboardProps {
  session?: any;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ session }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [judgmentForm, setJudgmentForm] = useState({
    speed: '5',
    comment: '',
    status: 'APPROVED' as 'APPROVED' | 'REJECTED',
    rejectionReason: '',
  });
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [submissionsRes, reportsRes] = await Promise.all([
        fetch('http://localhost:8000/api/admin/submissions/'),
        fetch('http://localhost:8000/api/admin/reports/'),
      ]);

      if (submissionsRes.ok) {
        const submissionsData = await submissionsRes.json();
        console.log('管理者ダッシュボード - 取得したデータ:', submissionsData[0]);
        // Django APIのレスポンス形式に合わせて変換
        const submissions = submissionsData.map((item: any) => ({
          id: item.id ? item.id.toString() : 'unknown',
          imageUrl: item.image.startsWith('http') ? item.image : `http://localhost:8000${item.image}`,
          thumbnailUrl: item.thumbnail ? 
            (item.thumbnail.startsWith('http') ? item.thumbnail : `http://localhost:8000${item.thumbnail}`) :
            (item.image.startsWith('http') ? item.image : `http://localhost:8000${item.image}`),
          watermarkedUrl: item.watermarked_image ? 
            (item.watermarked_image.startsWith('http') ? item.watermarked_image : `http://localhost:8000${item.watermarked_image}`) :
            (item.image.startsWith('http') ? item.image : `http://localhost:8000${item.image}`),
          speed: item.judgment?.speed_kmh || null,
          comment: item.judgment?.metaphor_comment || null,
          description: item.description || '',
          status: item.is_judged ? 'APPROVED' : 'PENDING',
          createdAt: item.created_at,
          user: { 
            name: item.user_username || 'テストユーザー',
            email: item.user_username || 'test@example.com'
          }
        }));
        console.log('管理者ダッシュボード - 変換後のデータ:', submissions[0]);
        setSubmissions(submissions);
      } else {
        console.error('投稿データの取得に失敗しました');
      }

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        // Django APIのレスポンス形式に合わせて変換
        const reports = reportsData.map((item: any) => ({
          id: item.id.toString(),
          reason: item.reason,
          description: item.description,
          status: item.is_resolved ? 'RESOLVED' : 'PENDING',
          createdAt: item.created_at,
          reporter: { 
            name: item.reporter_username || '通報者'
          }
        }));
        setReports(reports);
      } else {
        console.error('通報データの取得に失敗しました');
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJudgment = async (submissionId: string) => {
    try {
      console.log('=== 管理者判定開始 ===');
      console.log('Submission ID:', submissionId);
      console.log('判定フォーム:', judgmentForm);
      console.log('セッション情報:', session);
      
      if (judgmentForm.status === 'REJECTED' && !judgmentForm.rejectionReason) {
        alert('却下理由を選択してください');
        return;
      }

      const requestData = {
        speed: judgmentForm.status === 'APPROVED' ? parseFloat(judgmentForm.speed) : 0,
        comment: judgmentForm.status === 'APPROVED' ? judgmentForm.comment : judgmentForm.rejectionReason,
        status: judgmentForm.status,
      };
      
      console.log('送信データ:', requestData);
      console.log('API URL:', `/api/admin/submissions/${submissionId}/judge`);

      const response = await fetch(`/api/admin/submissions/${submissionId}/judge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      console.log('レスポンスステータス:', response.status);
      console.log('レスポンスヘッダー:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        console.log('判定保存成功:', result);
        await fetchData();
        setSelectedSubmission(null);
        setJudgmentForm({ speed: '5', comment: '', status: 'APPROVED', rejectionReason: '' });
        alert(judgmentForm.status === 'APPROVED' ? '承認しました' : '却下しました');
      } else {
        console.log('エラーレスポンス受信');
        const errorData = await response.json();
        console.error('判定保存エラー:', errorData);
        console.error('エラーレスポンス:', response.status, response.statusText);
        
        // エラーメッセージをより分かりやすく表示
        let errorMessage = '判定の保存に失敗しました';
        if (errorData.detail) {
          errorMessage = `エラー: ${errorData.detail}`;
        } else if (errorData.error) {
          errorMessage = `エラー: ${errorData.error}`;
        } else if (errorData.non_field_errors) {
          errorMessage = `エラー: ${errorData.non_field_errors.join(', ')}`;
        }
        console.log('表示するエラーメッセージ:', errorMessage);
        alert(errorMessage);
      }
    } catch (error) {
      console.error('判定エラー:', error);
      alert('判定の保存に失敗しました');
    }
  };

  const handleReportAction = async (reportId: string, action: 'RESOLVED' | 'DISMISSED') => {
    try {
      const response = await fetch(`http://localhost:8000/api/admin/reports/${reportId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: action }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('通報処理エラー:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />承認済み</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />却下</Badge>;
      case 'PENDING':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />判定待ち</Badge>;
    }
  };

  const getReportReasonLabel = (reason: string) => {
    const reasons = {
      'INAPPROPRIATE_CONTENT': '不適切な内容',
      'VIOLENCE': '暴力',
      'SPAM': 'スパム',
      'COPYRIGHT': '著作権侵害',
      'OTHER': 'その他',
    };
    return reasons[reason as keyof typeof reasons] || reason;
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'PENDING');
  const pendingReports = reports.filter(r => r.status === 'PENDING');
  const approvedSubmissions = submissions.filter(s => s.status === 'APPROVED');

  console.log('統計計算:', {
    totalSubmissions: submissions.length,
    pendingSubmissions: pendingSubmissions.length,
    pendingReports: pendingReports.length,
    approvedSubmissions: approvedSubmissions.length,
    submissions: submissions.map(s => ({ id: s.id, status: s.status }))
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">管理者ダッシュボード</h1>
              <p className="text-gray-600 mt-2">投稿の判定と管理を行う管理者専用画面</p>
              <div className="mt-2 flex items-center space-x-2">
                <Badge variant="outline" className="text-red-600 border-red-600">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  管理者権限が必要
                </Badge>
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  <Users className="h-3 w-3 mr-1" />
                  投稿の承認・却下
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={fetchData} disabled={loading}>
                {loading ? '更新中...' : 'データを更新'}
              </Button>
              <Button 
                onClick={handleLogoutClick}
                variant="outline"
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                ログアウト
              </Button>
            </div>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ImageIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">総投稿数</p>
                  <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">判定待ち</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingSubmissions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Flag className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">未処理通報</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingReports.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">承認済み</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {submissions.filter(s => s.status === 'APPROVED').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* メインタブ */}
        <Tabs defaultValue="submissions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="submissions">投稿管理</TabsTrigger>
            <TabsTrigger value="reports">通報管理</TabsTrigger>
            <TabsTrigger value="ranking">ランキング管理</TabsTrigger>
          </TabsList>

          {/* 投稿管理タブ */}
          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle>投稿一覧</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="border rounded-lg p-4">
                      <div className="flex items-start space-x-4">
                        <img
                          src={submission.thumbnailUrl}
                          alt="投稿画像"
                          className="w-24 h-24 object-cover rounded"
                          onError={(e) => {
                            console.error('画像読み込みエラー:', submission.thumbnailUrl);
                            e.currentTarget.src = '/placeholder-image.png';
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">投稿 #{submission.id.slice(-8)}</h3>
                            {getStatusBadge(submission.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            投稿者: {submission.user.name || '匿名ユーザー'}
                          </p>
                          {submission.description && (
                            <p className="text-sm text-gray-700 mb-2">
                              説明: {submission.description}
                            </p>
                          )}
                          {submission.speed && (
                            <p className="text-sm text-blue-600 mb-1">
                              速度: {submission.speed} km/h
                            </p>
                          )}
                          {submission.comment && (
                            <p className="text-sm text-gray-600 mb-1">
                              コメント: {submission.comment}
                            </p>
                          )}
                          <p className="text-sm text-gray-500">
                            {new Date(submission.createdAt).toLocaleDateString('ja-JP')}
                          </p>
                          <div className="mt-3">
                            <Button
                              size="sm"
                              onClick={() => setSelectedSubmission(submission)}
                            >
                              {submission.status === 'PENDING' ? '判定する' : '再判定'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 通報管理タブ */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>通報一覧</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingReports.map((report) => (
                    <div key={report.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge variant="destructive">
                              {getReportReasonLabel(report.reason)}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {new Date(report.createdAt).toLocaleDateString('ja-JP')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            通報者: {report.reporter.name || '匿名ユーザー'}
                          </p>
                          {report.description && (
                            <p className="text-sm text-gray-700 mb-3">
                              {report.description}
                            </p>
                          )}
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReportAction(report.id, 'DISMISSED')}
                            >
                              却下
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleReportAction(report.id, 'RESOLVED')}
                            >
                              対応済み
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ランキング管理タブ */}
          <TabsContent value="ranking">
            <Card>
              <CardHeader>
                <CardTitle>ランキング管理</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-600">
                    週次ランキングのスナップショットを作成できます。
                  </p>
                  <Button>
                    週次ランキング作成
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 判定ダイアログ */}
        {selectedSubmission && (
          <AlertDialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
            <AlertDialogContent className="max-w-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>投稿を判定する</AlertDialogTitle>
                <AlertDialogDescription>
                  投稿の速度とコメントを入力して判定してください。
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="space-y-4">
                <img
                  src={selectedSubmission.imageUrl}
                  alt="投稿画像"
                  className="w-full h-64 object-cover rounded"
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="speed">速度 (km/h)</Label>
                    <Input
                      id="speed"
                      type="number"
                      value={judgmentForm.speed}
                      onChange={(e) => setJudgmentForm(prev => ({ ...prev, speed: e.target.value }))}
                      placeholder="例: 85.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">判定</Label>
                    <Select
                      value={judgmentForm.status}
                      onValueChange={(value: 'APPROVED' | 'REJECTED') => 
                        setJudgmentForm(prev => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="APPROVED">承認</SelectItem>
                        <SelectItem value="REJECTED">却下</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {judgmentForm.status === 'APPROVED' ? (
                  <div>
                    <Label htmlFor="comment">コメント</Label>
                    <Textarea
                      id="comment"
                      value={judgmentForm.comment}
                      onChange={(e) => setJudgmentForm(prev => ({ ...prev, comment: e.target.value }))}
                      placeholder="例: 新幹線並みの速さ！"
                      rows={3}
                    />
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="rejectionReason">却下理由</Label>
                    <Select
                      value={judgmentForm.rejectionReason}
                      onValueChange={(value) => 
                        setJudgmentForm(prev => ({ ...prev, rejectionReason: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="却下理由を選択してください" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="不適切な内容">不適切な内容</SelectItem>
                        <SelectItem value="画像が不鮮明">画像が不鮮明</SelectItem>
                        <SelectItem value="パンチの瞬間が捉えられていない">パンチの瞬間が捉えられていない</SelectItem>
                        <SelectItem value="画像サイズが適切でない">画像サイズが適切でない</SelectItem>
                        <SelectItem value="その他">その他</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleJudgment(selectedSubmission.id)}>
                  判定を保存
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* ログアウト確認ダイアログ */}
        <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center">
                <LogOut className="h-5 w-5 mr-2 text-red-600" />
                ログアウトの確認
              </AlertDialogTitle>
              <AlertDialogDescription>
                管理者ダッシュボードからログアウトしますか？<br />
                ログアウト後は一般ユーザーサイトに戻ります。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700"
              >
                ログアウト
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AdminDashboard;
