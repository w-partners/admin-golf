'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Home, MapPin, Phone, Settings } from 'lucide-react';

export default function NewGolfCoursePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    region: '',
    address: '',
    phone: '',
    operationStatus: 'PENDING',
    notes: ''
  });

  // Check permission - only admins can create golf courses
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.accountType)) {
      toast({
        title: '권한 없음',
        description: '골프장 등록 권한이 없습니다.',
        variant: 'destructive'
      });
      router.push('/golf-courses');
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/golf-courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create golf course');
      }

      toast({
        title: '성공',
        description: '골프장이 성공적으로 등록되었습니다.'
      });
      router.push('/golf-courses');
    } catch (error: unknown) {
      toast({
        title: '오류',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const regionOptions = [
    { value: 'GANGWON', label: '강원' },
    { value: 'GYEONGSANG', label: '경상' },
    { value: 'CHUNGCHEONG', label: '충청' },
    { value: 'JEOLLA', label: '전라' },
    { value: 'JEJU', label: '제주' },
    { value: 'GYEONGBUK', label: '경북' },
    { value: 'GYEONGNAM', label: '경남' },
    { value: 'GYEONGDONG', label: '경동' }
  ];

  const statusOptions = [
    { value: 'API', label: 'API 연동' },
    { value: 'MANUAL', label: '수동' },
    { value: 'PENDING', label: '대기' }
  ];

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Home className="w-6 h-6" />
            골프장 등록
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Golf Course Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                골프장명 *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="예: 제주 오라CC"
                required
              />
            </div>

            {/* Region */}
            <div className="space-y-2">
              <Label htmlFor="region">
                지역 *
              </Label>
              <Select
                value={formData.region}
                onValueChange={(value) => setFormData({ ...formData, region: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="지역을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {regionOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">
                <MapPin className="inline w-4 h-4 mr-1" />
                주소 *
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="예: 제주특별자치도 제주시 오라동 123"
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                <Phone className="inline w-4 h-4 mr-1" />
                연락처 *
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="예: 064-123-4567"
                required
              />
            </div>

            {/* Operation Status */}
            <div className="space-y-2">
              <Label htmlFor="operationStatus">
                <Settings className="inline w-4 h-4 mr-1" />
                운영 상태 *
              </Label>
              <Select
                value={formData.operationStatus}
                onValueChange={(value) => setFormData({ ...formData, operationStatus: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">
                기타 메모
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="특이사항이나 메모를 입력하세요"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? '등록 중...' : '골프장 등록'}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => router.push('/golf-courses')}
              >
                취소
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}