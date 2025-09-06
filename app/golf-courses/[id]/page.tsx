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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, MapPin, Phone, Settings, Calendar, Clock, Users } from 'lucide-react';

export default function GolfCourseDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [golfCourse, setGolfCourse] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    region: '',
    address: '',
    phone: '',
    operationStatus: '',
    notes: ''
  });

  // Check permission
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  // Fetch golf course details
  useEffect(() => {
    fetchGolfCourse();
  }, [params.id]);

  const fetchGolfCourse = async () => {
    try {
      const response = await fetch(`/api/golf-courses/${params.id}`);
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      setGolfCourse(data);
      setFormData({
        name: data.name,
        region: data.region,
        address: data.address,
        phone: data.phone,
        operationStatus: data.operationStatus,
        notes: data.notes || ''
      });
    } catch (error) {
      toast({
        title: '오류',
        description: '골프장 정보를 불러오는데 실패했습니다.',
        variant: 'destructive'
      });
      router.push('/golf-courses');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/golf-courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: params.id,
          ...formData
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update golf course');
      }

      toast({
        title: '성공',
        description: '골프장 정보가 수정되었습니다.'
      });
      fetchGolfCourse();
    } catch (error: unknown) {
      toast({
        title: '오류',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const regionOptions = [
    { value: '강원', label: '강원' },
    { value: '경상', label: '경상' },
    { value: '충청', label: '충청' },
    { value: '전라', label: '전라' },
    { value: '제주', label: '제주' },
    { value: '경북', label: '경북' },
    { value: '경남', label: '경남' },
    { value: '경동', label: '경동' }
  ];

  const statusOptions = [
    { value: 'API', label: 'API 연동' },
    { value: 'MANUAL', label: '수동' },
    { value: 'PENDING', label: '대기' }
  ];

  const canEdit = session?.user.accountType === 'SUPER_ADMIN' || 
                  session?.user.accountType === 'ADMIN';

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-10">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Home className="w-6 h-6" />
              {golfCourse?.name}
            </CardTitle>
            <Button 
              variant="outline"
              onClick={() => router.push('/golf-courses')}
            >
              목록으로
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="info">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">기본 정보</TabsTrigger>
              <TabsTrigger value="teeTimes">티타임 현황</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="info">
              <form onSubmit={handleUpdate} className="space-y-6">
                {/* Golf Course Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">골프장명 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!canEdit}
                    required
                  />
                </div>

                {/* Region */}
                <div className="space-y-2">
                  <Label htmlFor="region">지역 *</Label>
                  <Select
                    value={formData.region}
                    onValueChange={(value) => setFormData({ ...formData, region: value })}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                    disabled={!canEdit}
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
                    disabled={!canEdit}
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
                    disabled={!canEdit}
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
                  <Label htmlFor="notes">기타 메모</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    disabled={!canEdit}
                    rows={3}
                  />
                </div>

                {/* Action Buttons */}
                {canEdit && (
                  <div className="flex gap-4 pt-4">
                    <Button type="submit" disabled={saving}>
                      {saving ? '저장 중...' : '정보 수정'}
                    </Button>
                  </div>
                )}
              </form>
            </TabsContent>

            {/* Tee Times Tab */}
            <TabsContent value="teeTimes">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">예정된 티타임</h3>
                {golfCourse?.teeTimes?.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    예정된 티타임이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {golfCourse?.teeTimes?.map((teeTime: unknown) => (
                      <div key={teeTime.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">
                                {new Date(teeTime.date).toLocaleDateString('ko-KR')}
                              </span>
                              <Clock className="w-4 h-4 text-gray-500 ml-2" />
                              <span>{teeTime.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-gray-500" />
                              <span>{teeTime.players}명</span>
                              <Badge variant={teeTime.bookingType === 'BOOKING' ? 'default' : 'secondary'}>
                                {teeTime.bookingType === 'BOOKING' ? '부킹' : '조인'}
                              </Badge>
                              <Badge variant="outline">
                                {teeTime.timePart === 'PART_1' ? '1부' : 
                                 teeTime.timePart === 'PART_2' ? '2부' : '3부'}
                              </Badge>
                            </div>
                          </div>
                          <Badge className={
                            teeTime.status === 'AVAILABLE' ? 'bg-green-500' :
                            teeTime.status === 'RESERVED' ? 'bg-yellow-500' :
                            teeTime.status === 'CONFIRMED' ? 'bg-blue-500' :
                            'bg-gray-500'
                          }>
                            {teeTime.status === 'AVAILABLE' ? '예약가능' :
                             teeTime.status === 'RESERVED' ? '예약중' :
                             teeTime.status === 'CONFIRMED' ? '확정' :
                             '완료'}
                          </Badge>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          그린피: {teeTime.greenFee}만원 | 
                          {teeTime.holes}홀 | 
                          {teeTime.caddie === 'REQUIRED' ? '캐디필수' : 
                           teeTime.caddie === 'OPTIONAL' ? '캐디선택' : '노캐디'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}