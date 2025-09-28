'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { unquoteOnce } from '@/utils/text';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ImageIcon, Trophy, Camera, Users, Clock, CheckCircle, XCircle, AlertCircle, Upload, Share, Heart, LogOut, LogIn, Settings, Bell, Crown, Star, Medal } from 'lucide-react';

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
    image?: string;
  };
}

const WebApp: React.FC = () => {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const isAuthenticated = !!session;
  const isAdmin = (session?.user as any)?.role === 'ADMIN';
  const [activeTab, setActiveTab] = useState('gallery');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Submission[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userSettings, setUserSettings] = useState({
    username: 'パンチマスター',
    email: 'punch@example.com',
    profileImage: null as string | null,
    bio: 'パンチの速さを競い合いましょう！'
  });

  // プロフィール情報を取得
  const fetchUserProfile = async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://world-fastest-punch.onrender.com';
      const response = await fetch(`${API_BASE}/api/profile/`);
      if (response.ok) {
        const data = await response.json();
        console.log('プロフィールデータ:', data);
        const newSettings = {
          ...userSettings,
          profileImage: data.profile_image || null,
          bio: data.bio || '',
          username: data.username || 'world.fastest.punch@gmail.com',
          email: data.email || 'world.fastest.punch@gmail.com'
        };
        console.log('プロフィール更新前:', userSettings);
        console.log('プロフィール更新後:', newSettings);
        setUserSettings(newSettings);
      } else {
        console.error('プロフィール取得失敗:', response.status);
      }
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
    }
  };

  // 通知データを取得
  const fetchNotifications = async () => {
    try {
      console.log('通知取得開始...');
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://world-fastest-punch.onrender.com';
      const response = await fetch(`${API_BASE}/api/notifications/`);
      console.log('通知APIレスポンス:', response.status, response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('通知データ:', data);
        // Django REST Frameworkのレスポンス形式に対応
        if (data && data.results && Array.isArray(data.results)) {
          console.log('通知を設定:', data.results);
          setNotifications(data.results);
        } else if (Array.isArray(data)) {
          console.log('通知を設定（直接配列）:', data);
          setNotifications(data);
        } else {
          console.warn('通知データが配列ではありません:', data);
          setNotifications([]);
        }
      } else {
        console.error('通知取得失敗:', response.status);
        setNotifications([]);
      }
    } catch (error) {
      console.error('通知取得エラー:', error);
      setNotifications([]);
    }
  };

  // プロフィール情報を保存
  const saveUserProfile = async (profileData: any) => {
    try {
      const formData = new FormData();
      
      // プロフィール画像の処理
      if (profileData.profileImage && typeof profileData.profileImage === 'string' && profileData.profileImage.startsWith('data:')) {
        try {
          // Base64画像をBlobに変換
          const response = await fetch(profileData.profileImage);
          const blob = await response.blob();
          formData.append('profile_image', blob, 'profile.jpg');
          console.log('画像をFormDataで送信:', blob.type, blob.size);
        } catch (imageError) {
          console.error('画像変換エラー:', imageError);
          // 画像変換に失敗した場合はスキップ
        }
      }
      
      // その他のフィールドを追加
      formData.append('bio', profileData.bio || '');
      if (profileData.username) {
        formData.append('username', profileData.username);
      }
      if (profileData.email) {
        formData.append('email', profileData.email);
      }

      console.log('保存するプロフィールデータ:', profileData);

      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://world-fastest-punch.onrender.com';
      const response = await fetch(`${API_BASE}/api/profile/`, {
        method: 'PUT',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('プロフィール保存成功:', data);
        
        // 保存後にプロフィールを再取得
        await fetchUserProfile();
        
        // 状態の確認
        console.log('保存後のuserSettings:', userSettings);
        return true;
      } else {
        const errorData = await response.json();
        console.error('プロフィール保存失敗:', response.status, errorData);
        
        // エラーメッセージを表示
        if (errorData.error) {
          alert(`エラー: ${errorData.error}`);
        } else {
          alert('設定の保存に失敗しました。');
        }
        return false;
      }
    } catch (error) {
      console.error('プロフィール保存エラー:', error);
      return false;
    }
  };

  // パンチ速度カテゴリーの定義
  const getSpeedCategory = (speed: number) => {
    if (speed >= 80) return 'とても速いパンチ';
    if (speed >= 60) return 'まあまあ速いパンチ';
    if (speed >= 40) return '普通のパンチ';
    if (speed >= 20) return 'あまり速くないパンチ';
    return 'ぜんぜん速くないパンチ';
  };

  // 詳細表示用のカテゴリー関数（統一版）
  const getSpeedCategoryForDetail = (speed: number) => {
    if (!speed) return '判定待ち';
    if (speed >= 80) return 'とても速いパンチ';
    if (speed >= 60) return 'まあまあ速いパンチ';
    if (speed >= 40) return '普通のパンチ';
    if (speed >= 20) return 'あまり速くないパンチ';
    return 'ぜんぜん速くないパンチ';
  };

  const getCategoryColor = (speed: number) => {
    if (speed >= 80) return 'text-red-600 bg-red-100';
    if (speed >= 60) return 'text-orange-600 bg-orange-100';
    if (speed >= 40) return 'text-yellow-600 bg-yellow-100';
    if (speed >= 20) return 'text-blue-600 bg-blue-100';
    return 'text-gray-600 bg-gray-100';
  };

  // モックデータ
  const mockSubmissions: Submission[] = [
    {
      id: '1',
      imageUrl: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=400&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=150&h=150&fit=crop',
      watermarkedUrl: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=400&fit=crop',
      speed: 95.5,
      comment: '新幹線並みの速さ！',
      status: 'APPROVED',
      createdAt: '2024-01-15T10:30:00Z',
      user: { name: 'パンチマスター', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop' }
    },
    {
      id: '2',
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop',
      watermarkedUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
      speed: 87.2,
      comment: '雷のような一撃！',
      status: 'APPROVED',
      createdAt: '2024-01-14T15:45:00Z',
      user: { name: 'ライトニング', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop' }
    },
    {
      id: '3',
      imageUrl: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=400&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=150&h=150&fit=crop',
      watermarkedUrl: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=400&fit=crop',
      speed: 72.8,
      comment: 'まあまあの速さ',
      status: 'APPROVED',
      createdAt: '2024-01-13T09:20:00Z',
      user: { name: 'スピードスター', image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop' }
    },
    {
      id: '4',
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop',
      watermarkedUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop',
      speed: 65.3,
      comment: '普通の速さ',
      status: 'APPROVED',
      createdAt: '2024-01-12T14:10:00Z',
      user: { name: 'ノーマルガイ', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop' }
    },
    {
      id: '5',
      imageUrl: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=400&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=150&h=150&fit=crop',
      watermarkedUrl: 'https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=400&h=400&fit=crop',
      speed: 45.7,
      comment: 'まだまだ練習が必要',
      status: 'APPROVED',
      createdAt: '2024-01-11T16:30:00Z',
      user: { name: 'ビギナー', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop' }
    },
    {
      id: '6',
      imageUrl: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=400&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=150&h=150&fit=crop',
      watermarkedUrl: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=400&fit=crop',
      speed: undefined,
      comment: undefined,
      status: 'PENDING',
      createdAt: '2024-01-10T11:15:00Z',
      user: { name: '判定待ちユーザー', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop' }
    }
  ];

  useEffect(() => {
    fetchSubmissions();
    fetchMySubmissions();
    fetchUserProfile();
    fetchNotifications();
  }, []);

  // セッション状態の変更を監視してプロフィールデータをクリア
  useEffect(() => {
    if (!isAuthenticated) {
      // ログアウト時はプロフィールデータをクリア
      setMySubmissions([]);
      setUserSettings({
        username: 'パンチマスター',
        email: 'punch@example.com',
        profileImage: null,
        bio: 'パンチの速さを競い合いましょう！'
      });
      setShowSettings(false);
    }
  }, [isAuthenticated]);

  // 管理者ログイン時の自動リダイレクトは削除（手動でアクセスするように変更）

  // プロフィール画像の変更を監視
  useEffect(() => {
    console.log('プロフィール画像が変更されました:', userSettings.profileImage);
  }, [userSettings.profileImage]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      // Django APIを直接呼び出し
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://world-fastest-punch.onrender.com';
      const response = await fetch(`${API_BASE}/api/submissions/`);
      if (response.ok) {
        const data = await response.json();
        console.log('Django APIレスポンス:', data);
        // Django APIのレスポンス形式に合わせて変換（承認済みのみ表示）
        const submissions = data.results
          .filter((item: any) => item.is_judged === true && item.is_rejected !== true)
          .map((item: any) => ({
            id: item.id ? item.id.toString() : 'unknown',
            imageUrl: item.image, // 既に絶対URLで返されている
            thumbnailUrl: item.thumbnail || item.image, // 既に絶対URLで返されている
            watermarkedUrl: item.watermarked_image,
            speed: item.judgment?.speed_kmh || null,
            comment: unquoteOnce(item.judgment?.metaphor_comment),
            description: item.description || '',
            status: 'APPROVED',
            createdAt: item.created_at,
            user: { name: item.user_username || 'テストユーザー' }
          }));
        console.log('変換後のsubmissions:', submissions);
        setSubmissions(submissions);
      } else {
        // APIが失敗した場合はモックデータを使用
        setSubmissions(mockSubmissions);
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
      // エラーの場合はモックデータを使用
      setSubmissions(mockSubmissions);
    } finally {
      setLoading(false);
    }
  };

  const fetchMySubmissions = async () => {
    try {
      console.log('=== fetchMySubmissions 開始 ===');
      console.log('現在のuserSettings:', userSettings);
      
      // Django APIを直接呼び出し
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://world-fastest-punch.onrender.com';
      const response = await fetch(`${API_BASE}/api/submissions/`);
      if (response.ok) {
        const data = await response.json();
        console.log('APIレスポンス全体:', data);
        console.log('投稿総数:', data.results?.length || 0);
        
        // 自分の投稿のみを表示（承認済み・判定待ち両方）
        const currentUsername = userSettings.username || 'ワールド';
        console.log('現在のユーザー名でフィルタ:', currentUsername);
        console.log('利用可能なユーザー名:', data.results?.map((item: any) => item.user_username) || []);
        
        const filteredSubmissions = data.results?.filter((item: any) => {
          const itemUsername = item.user_username?.trim();
          const currentUsernameTrimmed = currentUsername?.trim();
          const isMatch = itemUsername === currentUsernameTrimmed;
          console.log(`比較: "${itemUsername}" === "${currentUsernameTrimmed}"`, isMatch);
          return isMatch;
        }) || [];
        
        console.log('フィルタ後の投稿数:', filteredSubmissions.length);
        console.log('フィルタ後の投稿:', filteredSubmissions);
        
        const mySubmissions = filteredSubmissions
          .map((item: any) => ({
            id: item.id ? item.id.toString() : 'unknown',
            imageUrl: item.image,
            thumbnailUrl: item.thumbnail || item.image,
            watermarkedUrl: item.watermarked_image,
            speed: item.judgment?.speed_kmh || null,
            comment: unquoteOnce(item.judgment?.metaphor_comment),
            status: item.is_judged ? 'APPROVED' : 'PENDING',
            createdAt: item.created_at,
            user: { name: item.user_username || 'テストユーザー' },
            description: item.description || ''
          }));
        console.log('自分の投稿:', mySubmissions);
        setMySubmissions(mySubmissions);
      } else {
        console.error('自分の投稿取得エラー:', response.status);
      }
    } catch (error) {
      console.error('自分の投稿取得エラー:', error);
    }
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

  const getSpeedColor = (speed?: number) => {
    if (!speed) return '#999';
    if (speed >= 100) return '#FF1744';
    if (speed >= 80) return '#FF6B35';
    if (speed >= 60) return '#FFC107';
    if (speed >= 40) return '#4CAF50';
    return '#2196F3';
  };


  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('画像選択イベント発生:', event);
    const file = event.target.files?.[0];
    console.log('選択されたファイル:', file);
    
    if (file) {
      console.log('ファイル詳細:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
      });
      
      // ファイルサイズチェック（2MB以下）
      if (file.size > 2 * 1024 * 1024) {
        alert('画像ファイルは2MB以下にしてください。');
        return;
      }
      
      // ファイル形式チェック
      if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください。');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('画像読み込み完了');
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      console.log('ファイルが選択されませんでした');
    }
  };

  // 写真ライブラリから選択（Web環境用）
  const handlePhotoLibrarySelect = () => {
    console.log('写真ライブラリ選択開始');
    const input = document.getElementById('image-upload') as HTMLInputElement;
    if (input) {
      input.click();
    }
  };

  // カメラで撮影（Web環境用）
  const handleCameraCapture = () => {
    console.log('カメラ撮影開始');
    const input = document.getElementById('camera-capture') as HTMLInputElement;
    if (input) {
      input.click();
    }
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ファイルサイズチェック（2MB以下）
      if (file.size > 2 * 1024 * 1024) {
        alert('画像ファイルは2MB以下にしてください。');
        return;
      }
      
      // ファイル形式チェック
      if (!file.type.startsWith('image/')) {
        alert('画像ファイルを選択してください。');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setUserSettings(prev => ({
            ...prev,
            profileImage: result
          }));
        }
      };
      reader.onerror = () => {
        console.error('ファイル読み込みエラー');
        alert('ファイルの読み込みに失敗しました。');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      alert('ログインが必要です');
      return;
    }
    if (!selectedImage) {
      alert('画像を選択してください');
      return;
    }
    if (!agreed) {
      alert('利用規約に同意してください');
      return;
    }

    setLoading(true);
    try {
      console.log('投稿処理開始');
      console.log('選択された画像:', selectedImage);
      console.log('説明文:', description);
      
      // 画像をBlobに変換
      const response = await fetch(selectedImage);
      const blob = await response.blob();
      console.log('画像Blob作成完了:', blob.size, 'bytes');
      
      // FormDataを作成
      const formData = new FormData();
      formData.append('image', blob, 'punch.jpg');
      formData.append('description', description);
        formData.append('username', userSettings.username || 'world.fastest.punch@gmail.com');
        formData.append('email', userSettings.email || 'world.fastest.punch@gmail.com');
      console.log('FormData作成完了');

      // Django APIに直接投稿
      console.log('Django APIに投稿開始...');
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://world-fastest-punch.onrender.com';
      const apiResponse = await fetch(`${API_BASE}/api/submissions/`, {
        method: 'POST',
        body: formData,
      });
      console.log('APIレスポンス:', apiResponse.status, apiResponse.statusText);

      if (apiResponse.ok) {
        const result = await apiResponse.json();
        console.log('投稿成功レスポンス:', result);
        console.log('レスポンスのキー:', Object.keys(result));
        
        // IDの存在確認
        if (!result.id) {
          console.error('投稿レスポンスにIDがありません:', result);
          console.error('利用可能なフィールド:', Object.keys(result));
          alert('投稿は成功しました！管理者による判定をお待ちください。');
          
          // IDがなくても投稿をリフレッシュ
          fetchSubmissions();
          fetchMySubmissions();
          setSelectedImage(null);
          setDescription('');
          setAgreed(false);
          return;
        }
        
        alert('投稿が完了しました！管理者による判定をお待ちください。');
        
        // 新しい投稿をリストに追加
        const newSubmission: Submission = {
          id: result.id.toString(),
          imageUrl: result.image,
          thumbnailUrl: result.thumbnail || result.image,
          watermarkedUrl: result.watermarked_image,
          speed: undefined,
          comment: undefined,
          status: 'PENDING',
          createdAt: result.created_at,
          user: { name: 'ユーザー4' }
        };
        
        setSubmissions(prev => [newSubmission, ...prev]);
        setMySubmissions(prev => [newSubmission, ...prev]);
        setSelectedImage(null);
        setDescription('');
        setAgreed(false);
      } else {
        console.error('APIエラーレスポンス:', apiResponse.status, apiResponse.statusText);
        let errorMessage = '投稿に失敗しました';
        try {
          const error = await apiResponse.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = `HTTP ${apiResponse.status}: ${apiResponse.statusText}`;
        }
        console.error('エラー詳細:', errorMessage);
        alert(`投稿に失敗しました: ${errorMessage}`);
      }
    } catch (error) {
      console.error('投稿エラー:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
      console.error('エラーの詳細:', errorMessage);
      alert(`ネットワークエラーが発生しました: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmissionClick = (submission: Submission) => {
    setSelectedSubmission(submission);
  };

  const renderGallery = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {submissions.map((submission) => (
        <Card 
          key={submission.id} 
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleSubmissionClick(submission)}
        >
          <div className="relative">
            <img
              src={submission.thumbnailUrl}
              alt="パンチ画像"
              className="w-full h-32 object-cover rounded-t-lg"
            />
            <div className="absolute top-2 right-2">
              {getStatusBadge(submission.status)}
            </div>
          </div>
          <CardContent className="p-3">
            <div className="text-center">
              <h3 className="font-bold text-sm" style={{ color: getSpeedColor(submission.speed) }}>
                {submission.speed ? `${submission.speed} km/h` : '判定待ち'}
              </h3>
              {submission.speed && (
                <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${getCategoryColor(submission.speed)}`}>
                  {getSpeedCategory(submission.speed)}
                </div>
              )}
              {submission.description && (
                <p className="text-xs text-gray-700 mt-1 line-clamp-2">{submission.description}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {submission.user.name || '匿名ユーザー'}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderSubmit = () => {
    // 一時的に認証チェックを無効化
    // if (!session) {
    //   return (
    //     <div className="max-w-2xl mx-auto">
    //       <Card>
    //         <CardHeader>
    //           <CardTitle className="text-center text-2xl text-orange-500">ログインが必要です</CardTitle>
    //           <p className="text-center text-gray-600">
    //             投稿するにはGoogleでログインしてください
    //           </p>
    //         </CardHeader>
    //         <CardContent className="space-y-6">
    //           <div className="text-center">
    //             <Button
    //               onClick={() => signIn('google')}
    //               className="w-full bg-blue-500 hover:bg-blue-600"
    //               size="lg"
    //             >
    //               Googleでログイン
    //             </Button>
    //           </div>
    //         </CardContent>
    //       </Card>
    //     </div>
    //   );
    // }

    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl text-orange-500">パンチ画像を投稿</CardTitle>
            <p className="text-center text-gray-600">
              あなたのパンチのイラストを投稿して、世界一速いパンチを競いましょう！
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
          {/* 注意事項 */}
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <h4 className="font-bold text-yellow-800 mb-2">⚠️ 投稿時の注意事項</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• 血、殴られている人、公序良俗に反する内容は禁止です</li>
                <li>• 画像は2MB以下、JPEG/PNG/TIFF形式のみ対応</li>
                <li>• 投稿された画像は透かしが入り、管理者による判定が必要です</li>
                <li>• 不適切な内容と判断された場合は削除される場合があります</li>
              </ul>
            </CardContent>
          </Card>

          {/* 速度カテゴリー定義 */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="font-bold text-blue-800 mb-3">🏆 パンチ速度カテゴリー</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-700"><strong>とても速いパンチ:</strong> 80km/h以上</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-orange-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-700"><strong>まあまあ速いパンチ:</strong> 60-79km/h</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-yellow-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-700"><strong>普通のパンチ:</strong> 40-59km/h</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-700"><strong>あまり速くないパンチ:</strong> 20-39km/h</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                  </div>
                  <span className="text-gray-700"><strong>ぜんぜん速くないパンチ:</strong> 20km/h未満</span>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                ※ 管理者が速度を判定し、該当するカテゴリーに分類されます
              </p>
            </CardContent>
          </Card>

          {/* 画像選択 */}
          <div>
            <Label className="text-lg font-semibold">画像を選択</Label>
            {selectedImage ? (
              <div className="mt-4">
                <img
                  src={selectedImage}
                  alt="選択された画像"
                  className="w-48 h-48 object-cover rounded-lg mx-auto"
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedImage(null)}
                    className="flex-1"
                  >
                    変更
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                {/* Web環境用の隠しinput要素 */}
                <input
                  type="file"
                  accept="image/*,.heic,.heif"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  multiple={false}
                />
                <input
                  type="file"
                  accept="image/*,.heic,.heif"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="camera-capture"
                  multiple={false}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* ファイルから選択 */}
                  <div>
                    <input
                      type="file"
                      accept="image/*,.heic,.heif"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="file-upload"
                      multiple={false}
                    />
                    <Label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center h-24 sm:h-28 border-2 border-purple-300 border-dashed rounded-xl cursor-pointer bg-purple-50 hover:bg-purple-100 active:bg-purple-200 transition-colors group touch-manipulation"
                      onClick={() => console.log('ファイル選択ボタンがクリックされました')}
                    >
                      <Upload className="w-8 h-8 text-purple-500 mb-2 group-hover:text-purple-600" />
                      <p className="text-sm text-purple-600 text-center font-medium">ファイルから選択</p>
                      <p className="text-xs text-purple-500 text-center mt-1">フォルダから選択</p>
                    </Label>
                  </div>
                  
                  {/* 写真ライブラリから選択 */}
                  <div>
                    <button
                      type="button"
                      onClick={handlePhotoLibrarySelect}
                      className="w-full flex flex-col items-center justify-center h-24 sm:h-28 border-2 border-blue-300 border-dashed rounded-xl cursor-pointer bg-blue-50 hover:bg-blue-100 active:bg-blue-200 transition-colors group touch-manipulation"
                    >
                      <ImageIcon className="w-8 h-8 text-blue-500 mb-2 group-hover:text-blue-600" />
                      <p className="text-sm text-blue-600 text-center font-medium">写真ライブラリ</p>
                      <p className="text-xs text-blue-500 text-center mt-1">既存の写真から選択</p>
                    </button>
                  </div>
                  
                  {/* カメラで撮影 */}
                  <div>
                    <button
                      type="button"
                      onClick={handleCameraCapture}
                      className="w-full flex flex-col items-center justify-center h-24 sm:h-28 border-2 border-green-300 border-dashed rounded-xl cursor-pointer bg-green-50 hover:bg-green-100 active:bg-green-200 transition-colors group touch-manipulation"
                    >
                      <Camera className="w-8 h-8 text-green-500 mb-2 group-hover:text-green-600" />
                      <p className="text-sm text-green-600 text-center font-medium">カメラで撮影</p>
                      <p className="text-xs text-green-500 text-center mt-1">今すぐ撮影</p>
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 text-center font-medium mb-2">
                    📱 写真の選択方法
                  </p>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>• <strong>ファイルから選択</strong>：フォルダから画像ファイルを選択</p>
                    <p>• <strong>写真ライブラリ</strong>：ファイル選択ダイアログから写真を選択</p>
                    <p>• <strong>カメラで撮影</strong>：カメラ対応ブラウザで撮影</p>
                    <p>• 対応形式：JPEG、PNG、HEIC、HEIF</p>
                    <p>• ファイルサイズ：2MB以下</p>
                    <p>• すべての選択方法で同じファイル選択ダイアログが開きます</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 説明文 */}
          <div>
            <Label htmlFor="description" className="text-lg font-semibold">説明文（オプション）</Label>
            <Textarea
              id="description"
              placeholder="パンチについて説明してください"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          {/* 利用規約同意 */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="agreement"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="agreement" className="text-sm">
              上記の注意事項を理解し、利用規約に同意します
            </Label>
          </div>

          {/* 投稿ボタン */}
          <Button
            onClick={handleSubmit}
            disabled={!selectedImage || !agreed || loading}
            className="w-full bg-orange-500 hover:bg-orange-600"
            size="lg"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                投稿中...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                投稿する
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
    );
  };

  // 通知表示
  const renderNotifications = () => {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">通知</h2>
          <p className="text-gray-600">パンチ投稿の判定結果をお知らせします</p>
        </div>

        {notifications && Array.isArray(notifications) && notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => {
              console.log('通知データ:', notification);
              return (
              <Card key={notification.id} className={`p-4 ${!notification.is_read ? 'bg-blue-50 border-blue-200' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                    <p className="text-gray-600 mt-1">{notification.message}</p>
                    {notification.rejection_reason && (
                      <p className="text-red-600 mt-2 font-medium">
                        理由: {notification.rejection_reason}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(notification.created_at).toLocaleString('ja-JP')}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <button
                      onClick={() => markNotificationAsRead(notification.id)}
                      className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
                    >
                      既読
                    </button>
                  )}
                </div>
              </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Bell className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">通知はありません</h3>
            <p className="text-gray-600">パンチを投稿すると、ここに通知が表示されます</p>
          </div>
        )}
      </div>
    );
  };

  // 通知を既読にする
  const markNotificationAsRead = async (notificationId: number) => {
    try {
      console.log('通知既読開始:', notificationId);
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://world-fastest-punch.onrender.com';
      const response = await fetch(`${API_BASE}/api/notifications/${notificationId}/read/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('既読APIレスポンス:', response.status, response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('既読APIデータ:', data);
        
        // 通知を再取得して最新状態を反映
        await fetchNotifications();
        
        alert('既読にしました');
      } else {
        const errorData = await response.json();
        console.error('既読APIエラー:', errorData);
        alert('既読の設定に失敗しました');
      }
    } catch (error) {
      console.error('通知既読エラー:', error);
      alert('既読の設定に失敗しました');
    }
  };

  const renderRanking = () => {
    const categories = [
      { value: 'OVERALL', label: '総合ランキング', minSpeed: 0, color: 'text-orange-600 bg-orange-100' },
      { value: 'VERY_FAST', label: 'とても速いパンチ', minSpeed: 80, color: 'text-red-600 bg-red-100' },
      { value: 'QUITE_FAST', label: 'まあまあ速いパンチ', minSpeed: 60, color: 'text-orange-600 bg-orange-100' },
      { value: 'MODERATE', label: '普通のパンチ', minSpeed: 40, color: 'text-yellow-600 bg-yellow-100' },
      { value: 'SLOW', label: 'あまり速くないパンチ', minSpeed: 20, color: 'text-blue-600 bg-blue-100' },
      { value: 'VERY_SLOW', label: 'ぜんぜん速くないパンチ', minSpeed: 0, color: 'text-gray-600 bg-gray-100' },
    ];

    const [selectedCategory, setSelectedCategory] = useState('OVERALL');

    const filteredSubmissions = submissions.filter(submission => {
      if (!submission.speed) return false;
      
      if (selectedCategory === 'OVERALL') {
        return true; // 総合ランキングは全ての投稿を含む
      } else if (selectedCategory === 'VERY_FAST') {
        return submission.speed >= 80;
      } else if (selectedCategory === 'QUITE_FAST') {
        return submission.speed >= 60 && submission.speed < 80;
      } else if (selectedCategory === 'MODERATE') {
        return submission.speed >= 40 && submission.speed < 60;
      } else if (selectedCategory === 'SLOW') {
        return submission.speed >= 20 && submission.speed < 40;
      } else if (selectedCategory === 'VERY_SLOW') {
        return submission.speed < 20;
      }
      return true;
    }).sort((a, b) => (b.speed || 0) - (a.speed || 0));

    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-orange-500 mb-2">
            {selectedCategory === 'OVERALL' ? '総合ランキング TOP 10' : 'パンチ速度ランキング'}
          </h2>
          <p className="text-gray-600">
            {selectedCategory === 'OVERALL' 
              ? '全カテゴリーを合わせた総合ランキング' 
              : '各カテゴリーのトップパンチをチェックしよう！'
            }
          </p>
        </div>

        {/* カテゴリ選択 */}
        <div className="mb-8">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full max-w-md mx-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.value} value={category.value}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ランキングリスト */}
        <div className="space-y-4">
          {filteredSubmissions.length > 0 ? (
            filteredSubmissions
              .slice(0, selectedCategory === 'OVERALL' ? 10 : filteredSubmissions.length)
              .map((submission, index) => {
                console.log(`ランキング ${index + 1}位 - 投稿データ:`, {
                  id: submission.id,
                  description: submission.description,
                  speed: submission.speed,
                  user: submission.user
                });
                return (
              <Card key={submission.id} className={`cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] ${
                index === 0 ? 'border-4 border-yellow-300 bg-gradient-to-br from-yellow-50 via-yellow-100 to-yellow-200 shadow-yellow-300' :
                index === 1 ? 'border-4 border-gray-300 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 shadow-gray-300' :
                index === 2 ? 'border-4 border-orange-300 bg-gradient-to-br from-orange-50 via-orange-100 to-orange-200 shadow-orange-300' :
                index === 3 ? 'border border-gray-200 bg-white shadow-gray-100' :
                'border border-gray-200 bg-white shadow-gray-100'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-6">
                    {/* ランキング順位 - 王冠付き */}
                    <div className="flex-shrink-0 relative">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold shadow-2xl ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 text-yellow-900 shadow-yellow-400 animate-pulse border-4 border-yellow-200' :
                        index === 1 ? 'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-500 text-gray-800 shadow-gray-400 border-4 border-gray-200' :
                        index === 2 ? 'bg-gradient-to-br from-orange-300 via-orange-400 to-orange-600 text-orange-900 shadow-orange-400 border-4 border-orange-200' :
                        index === 3 ? 'bg-white border-4 border-orange-400 text-orange-600 shadow-orange-200' :
                        'bg-white border-4 border-orange-400 text-orange-600 shadow-orange-200'
                      }`}>
                        {index === 0 ? <Crown className="w-10 h-10 animate-bounce" /> : index + 1}
                      </div>
                      {index < 3 && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                          <Star className={`w-5 h-5 ${
                            index === 0 ? 'text-yellow-600' :
                            index === 1 ? 'text-gray-600' :
                            'text-orange-600'
                          }`} />
                        </div>
                      )}
                    </div>

                    {/* 投稿画像 - より大きく、装飾付き */}
                    <div className="flex-shrink-0 relative">
                      <div className={`w-24 h-24 rounded-xl overflow-hidden border-4 shadow-xl ${
                        index === 0 ? 'border-yellow-300' :
                        index === 1 ? 'border-gray-300' :
                        index === 2 ? 'border-orange-300' :
                        index === 3 ? 'border-orange-400' :
                        'border-orange-400'
                      }`}>
                        <img
                          src={submission.thumbnailUrl}
                          alt="パンチ画像"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {index > 2 && (
                        <div className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                          index === 3 ? 'bg-orange-500' :
                          'bg-orange-500'
                        }`}>
                          {index + 1}
                        </div>
                      )}
                    </div>

                    {/* 投稿者情報と速度 - よりモダンなデザイン */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`p-3 rounded-full ${
                            index === 0 ? 'bg-yellow-200' :
                            index === 1 ? 'bg-gray-200' :
                            index === 2 ? 'bg-orange-200' :
                            index === 3 ? 'bg-orange-100' :
                            'bg-orange-100'
                          }`}>
                            <Users className={`w-6 h-6 ${
                              index === 0 ? 'text-yellow-700' :
                              index === 1 ? 'text-gray-700' :
                              index === 2 ? 'text-orange-700' :
                              index === 3 ? 'text-orange-600' :
                              'text-orange-600'
                            }`} />
                          </div>
                          <div>
                            <p className="font-bold text-xl text-gray-800">
                              {submission.user?.name || (typeof submission.user === 'string' ? submission.user : '匿名ユーザー')}
                            </p>
                            {index < 3 && (
                              <p className={`text-sm font-medium ${
                                index === 0 ? 'text-yellow-600' :
                                index === 1 ? 'text-gray-600' :
                                'text-orange-600'
                              }`}>
                                {index === 0 ? '🥇 チャンピオン' :
                                 index === 1 ? '🥈 準優勝' :
                                 '🥉 第3位'}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge className={`px-4 py-2 text-sm font-semibold shadow-md ${getCategoryColor(submission.speed || 0)}`}>
                          {getSpeedCategory(submission.speed || 0)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-3">
                          <div className={`p-3 rounded-full ${
                            index === 0 ? 'bg-yellow-200' :
                            index === 1 ? 'bg-gray-200' :
                            index === 2 ? 'bg-orange-200' :
                            index === 3 ? 'bg-orange-100' :
                            'bg-orange-100'
                          }`}>
                            <Trophy className={`w-7 h-7 ${
                              index === 0 ? 'text-yellow-700' :
                              index === 1 ? 'text-gray-700' :
                              index === 2 ? 'text-orange-700' :
                              index === 3 ? 'text-orange-600' :
                              'text-orange-600'
                            }`} />
                          </div>
                          <div>
                            <p className={`font-bold text-4xl ${
                              index === 0 ? 'text-yellow-700' :
                              index === 1 ? 'text-gray-700' :
                              index === 2 ? 'text-orange-700' :
                              index === 3 ? 'text-orange-600' :
                              'text-orange-600'
                            }`}>
                              {submission.speed}km/h
                            </p>
                            <p className="text-sm text-gray-500 font-medium">最高速度</p>
                          </div>
                        </div>
                        {submission.description && (
                          <div className="flex-1 bg-gray-50 rounded-lg p-3 border-l-4 border-orange-400">
                            <p className="text-gray-700 italic font-medium">
                              {unquoteOnce(submission.description)}
                            </p>
                          </div>
                        )}
                        {!submission.description && (
                          <div className="flex-1 bg-gray-50 rounded-lg p-3 border-l-4 border-gray-300">
                            <p className="text-gray-500 italic font-medium">
                              説明文なし
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })
          ) : (
            <Card className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300">
              <CardContent>
                <div className="relative">
                  <Crown className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                    <Star className="w-6 h-6 text-yellow-400 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-3">
                  {categories.find(cat => cat.value === selectedCategory)?.label}の投稿がありません
                </h3>
                <p className="text-gray-600 text-lg mb-4">
                  最初の投稿者になってランキングの頂点を目指しましょう！
                </p>
                <div className="flex justify-center space-x-2">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                  <Medal className="w-6 h-6 text-gray-400" />
                  <Star className="w-6 h-6 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

      </div>
    );
  };

  const renderProfile = () => {
    console.log('=== renderProfile 開始 ===');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('mySubmissions:', mySubmissions);
    console.log('mySubmissions.length:', mySubmissions.length);
    
    // ログインしていない場合はログインボタンを表示
    if (!isAuthenticated) {
      return (
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-center">プロフィール</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">ログインが必要です</h3>
                <p className="text-gray-600 mb-6">プロフィールを表示するにはログインしてください</p>
                <Button onClick={() => signIn()} className="bg-orange-500 hover:bg-orange-600">
                  <LogIn className="w-4 h-4 mr-2" />
                  ログイン
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    const approvedCount = mySubmissions.filter(s => s.status === 'APPROVED').length;
    const pendingCount = mySubmissions.filter(s => s.status === 'PENDING').length;
    const maxSpeed = Math.max(...mySubmissions.filter(s => s.speed).map(s => s.speed || 0));
    const avgSpeed = mySubmissions.filter(s => s.speed).length > 0 
      ? mySubmissions.filter(s => s.speed).reduce((sum, s) => sum + (s.speed || 0), 0) / mySubmissions.filter(s => s.speed).length
      : 0;
    
    console.log('統計:', { approvedCount, pendingCount, maxSpeed, avgSpeed });

    return (
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-center">プロフィール</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                {userSettings.profileImage ? (
                  <img
                    src={userSettings.profileImage}
                    alt="プロフィール画像"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <h3 className="text-xl font-bold">{userSettings.username}</h3>
              <p className="text-gray-600">{userSettings.email}</p>
              <p className="text-sm text-gray-500 mt-1">{userSettings.bio}</p>
              <Button
                onClick={async () => {
                  await fetchUserProfile();
                  setShowSettings(true);
                }}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                <Settings className="w-4 h-4 mr-2" />
                設定を変更
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-500">{mySubmissions.length}</div>
                <div className="text-sm text-gray-600">総投稿数</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-500">{approvedCount}</div>
                <div className="text-sm text-gray-600">承認済み</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-500">{pendingCount}</div>
                <div className="text-sm text-gray-600">判定待ち</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-500">{maxSpeed.toFixed(1)}</div>
                <div className="text-sm text-gray-600">最高速度 (km/h)</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 自分の投稿一覧 */}
        <Card>
          <CardHeader>
            <CardTitle>自分の投稿</CardTitle>
          </CardHeader>
          <CardContent>
            {mySubmissions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                まだ投稿がありません
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mySubmissions.map((submission) => (
                  <Card key={submission.id} className="overflow-hidden">
                    <div className="aspect-square relative">
                      <img
                        src={submission.thumbnailUrl}
                        alt="投稿画像"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        {getStatusBadge(submission.status)}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        {submission.speed && (
                          <div>
                            <div className="text-lg font-bold text-orange-500">
                              {submission.speed} km/h
                            </div>
                            <div className={`text-xs px-2 py-1 rounded-full inline-block ${getCategoryColor(submission.speed)}`}>
                              {getSpeedCategory(submission.speed)}
                            </div>
                          </div>
                        )}
                        {submission.description && (
                          <div className="text-sm text-gray-700">
                            <span className="font-medium">投稿者の説明:</span> {submission.description}
                          </div>
                        )}
                        {submission.comment && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">管理者のコメント:</span> {unquoteOnce(submission.comment)}
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          {new Date(submission.createdAt).toLocaleDateString('ja-JP')}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl text-orange-500">ユーザー設定</CardTitle>
            <p className="text-center text-gray-600">
              プロフィール情報を設定して、あなたのアカウントをカスタマイズしましょう
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* プロフィール画像 */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                  {userSettings.profileImage ? (
                    <img
                      src={userSettings.profileImage}
                      alt="プロフィール画像"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-16 h-16 text-gray-400" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  className="hidden"
                  id="profile-image-upload"
                />
                <Label
                  htmlFor="profile-image-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  画像を変更
                </Label>
              </div>
            </div>

            {/* ユーザー情報フォーム */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">ユーザー名</Label>
                <Input
                  id="username"
                  value={userSettings.username}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="ユーザー名を入力"
                />
              </div>

              <div>
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  value={userSettings.email}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="メールアドレスを入力"
                />
              </div>

              <div>
                <Label htmlFor="bio">自己紹介</Label>
                <textarea
                  id="bio"
                  value={userSettings.bio}
                  onChange={(e) => setUserSettings(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="自己紹介を入力"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  rows={3}
                />
              </div>
            </div>

            {/* 保存ボタン */}
            <div className="flex space-x-4">
              <Button
                onClick={async () => {
                  const success = await saveUserProfile(userSettings);
                  if (success) {
                    alert('設定が保存されました！');
                    setShowSettings(false);
                    // プロフィール更新後に自分の投稿を再取得
                    fetchMySubmissions();
                  }
                  // エラーメッセージはsaveUserProfile内で表示されるため、ここでは何もしない
                }}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                設定を保存
              </Button>
              <Button
                onClick={() => setShowSettings(false)}
                variant="outline"
                className="flex-1"
              >
                キャンセル
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-orange-500 mr-2" />
              <h1 className="text-xl font-bold text-gray-900">世界一速いパンチ</h1>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {userSettings.profileImage ? (
                        <img
                          src={userSettings.profileImage}
                          alt="プロフィール画像"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Users className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-800">
                      {userSettings.username}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setShowLogoutDialog(true)}>
                    <LogOut className="w-4 h-4 mr-2" />
                    ログアウト
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => signIn()}>
                  <LogIn className="w-4 h-4 mr-2" />
                  ログイン
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Share className="w-4 h-4 mr-2" />
                シェア
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          if (value === 'profile') {
            console.log('プロフィールタブが選択されました。fetchMySubmissionsを実行します。');
            fetchMySubmissions();
          }
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 p-1 rounded-xl shadow-lg border border-gray-200">
            <TabsTrigger 
              value="gallery"
              className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-200 data-[state=active]:scale-105 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md rounded-lg font-semibold"
            >
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4" />
                <span>ギャラリー</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="submit"
              className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-200 data-[state=active]:scale-105 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md rounded-lg font-semibold"
            >
              <div className="flex items-center space-x-2">
                <Camera className="w-4 h-4" />
                <span>投稿</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="ranking"
              className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-yellow-200 data-[state=active]:scale-105 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md rounded-lg font-semibold"
            >
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4" />
                <span>ランキング</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="profile"
              className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-200 data-[state=active]:scale-105 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md rounded-lg font-semibold"
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>プロフィール</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-purple-200 data-[state=active]:scale-105 transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-md rounded-lg font-semibold"
              onClick={() => fetchNotifications()}
            >
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>通知</span>
                {notifications && Array.isArray(notifications) && notifications.filter(n => !n.is_read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-lg">
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gallery">
            {renderGallery()}
          </TabsContent>

          <TabsContent value="submit">
            {renderSubmit()}
          </TabsContent>

          <TabsContent value="ranking">
            {renderRanking()}
          </TabsContent>

          <TabsContent value="profile">
            {showSettings ? renderSettings() : renderProfile()}
          </TabsContent>

          <TabsContent value="notifications">
            {renderNotifications()}
          </TabsContent>
        </Tabs>
      </main>

      {/* 詳細ダイアログ */}
      {selectedSubmission && (
        <AlertDialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>投稿詳細</AlertDialogTitle>
            </AlertDialogHeader>
            
            <div className="space-y-4">
              <img
                src={selectedSubmission.watermarkedUrl || selectedSubmission.imageUrl}
                alt="投稿画像"
                className="w-full h-64 object-cover rounded"
              />
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold" style={{ color: getSpeedColor(selectedSubmission.speed) }}>
                    {selectedSubmission.speed ? `${selectedSubmission.speed} km/h` : '判定待ち'}
                  </h3>
                  <Badge
                    style={{ backgroundColor: getSpeedColor(selectedSubmission.speed) }}
                    className="text-white mt-1"
                  >
                    {getSpeedCategoryForDetail(selectedSubmission.speed || 0)}
                  </Badge>
                </div>
                {getStatusBadge(selectedSubmission.status)}
              </div>
              
              {selectedSubmission.comment && (
                <p className="text-lg italic text-gray-700">
                  {unquoteOnce(selectedSubmission.comment)}
                </p>
              )}
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{selectedSubmission.user.name || '匿名ユーザー'}</span>
                <span>•</span>
                <span>{new Date(selectedSubmission.createdAt).toLocaleDateString('ja-JP')}</span>
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>閉じる</AlertDialogCancel>
              <AlertDialogAction onClick={() => setActiveTab('submit')}>
                投稿する
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      </div>

      {/* ログアウト確認ダイアログ */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ログアウトの確認</AlertDialogTitle>
            <AlertDialogDescription>
              本当にログアウトしますか？ログアウトすると、投稿機能が利用できなくなります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                // プロフィールデータをクリア
                setMySubmissions([]);
                setUserSettings({
                  username: 'パンチマスター',
                  email: 'punch@example.com',
                  profileImage: null,
                  bio: 'パンチの速さを競い合いましょう！'
                });
                setShowSettings(false);
                // ログアウト実行
                signOut({ callbackUrl: '/' });
                setShowLogoutDialog(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              ログアウト
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default WebApp;
