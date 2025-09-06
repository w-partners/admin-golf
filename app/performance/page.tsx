'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  CheckCircle,
  Filter,
  Home
} from 'lucide-react';

export default function PerformancePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [teeTimes, setTeeTimes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [selectedTeeTime, setSelectedTeeTime] = useState<any>(null);
  const [registrationDialog, setRegistrationDialog] = useState(false);
  const [performanceData, setPerformanceData] = useState({
    commissionType: 'PERCENTAGE',
    commissionAmount: '',
    settlementMethod: 'BANK_TRANSFER',
    notes: ''
  });

  // Check permission
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }

    const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'INTERNAL_MANAGER', 'EXTERNAL_MANAGER', 'PARTNER'];
    if (!allowedRoles.includes(session.user.accountType)) {
      toast({
        title: '권한 없음',
        description: '실적 등록 권한이 없습니다.',
        variant: 'destructive'
      });
      router.push('/');
    }
  }, [session, status, router]);

  // Fetch completed tee times
  useEffect(() => {
    fetchCompletedTeeTimes();
  }, [showAll]);

  const fetchCompletedTeeTimes = async () => {
    try {
      const params = new URLSearchParams();
      if (showAll) params.append('showAll', 'true');

      const response = await fetch(`/api/performance?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setTeeTimes(data);
    } catch (error) {
      toast({
        title: '오류',
        description: '완료된 티타임 목록을 불러오는데 실패했습니다.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCompleted = async (teeTimeId: string) => {
    try {
      const response = await fetch('/api/performance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teeTimeId })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast({
        title: '성공',
        description: '티타임이 완료 처리되었습니다.'
      });
      fetchCompletedTeeTimes();
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handlePerformanceRegistration = async () => {
    if (!selectedTeeTime) return;

    try {
      const response = await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teeTimeId: selectedTeeTime.id,
          ...performanceData,
          commissionAmount: parseFloat(performanceData.commissionAmount) || 0
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast({
        title: '성공',
        description: '실적이 성공적으로 등록되었습니다.'
      });
      setRegistrationDialog(false);
      setSelectedTeeTime(null);
      setPerformanceData({
        commissionType: 'PERCENTAGE',
        commissionAmount: '',
        settlementMethod: 'BANK_TRANSFER',
        notes: ''
      });
      fetchCompletedTeeTimes();
    } catch (error: any) {
      toast({
        title: '오류',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const canSeeAll = ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER'].includes(session?.user.accountType || '');

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              실적 등록
            </CardTitle>
            {canSeeAll && (
              <div className="flex items-center gap-2">
                <Label htmlFor="showAll">전체 보기</Label>
                <Switch
                  id="showAll"
                  checked={showAll}
                  onCheckedChange={setShowAll}
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-10">로딩 중...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>골프장</TableHead>
                    <TableHead>날짜/시간</TableHead>
                    <TableHead>매니저</TableHead>
                    <TableHead>인원</TableHead>
                    <TableHead>그린피</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead className="text-center">실적등록</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teeTimes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-10">
                        완료된 티타임이 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    teeTimes.map((teeTime) => (
                      <TableRow key={teeTime.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Home className="w-4 h-4 text-gray-400" />
                            {teeTime.golfCourse.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              {new Date(teeTime.date).toLocaleDateString('ko-KR')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              {teeTime.time}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {teeTime.confirmedBy?.name || '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            {teeTime.players}명
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            {teeTime.greenFee}만원
                          </div>
                        </TableCell>
                        <TableCell>
                          {teeTime.performanceRegistered ? (
                            <Badge className="bg-green-500">
                              실적등록완료
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              미등록
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {!teeTime.performanceRegistered && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedTeeTime(teeTime);
                                setRegistrationDialog(true);
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              등록
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Registration Dialog */}
      <Dialog open={registrationDialog} onOpenChange={setRegistrationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>실적 등록</DialogTitle>
            <DialogDescription>
              {selectedTeeTime?.golfCourse.name} - {selectedTeeTime?.date && new Date(selectedTeeTime.date).toLocaleDateString('ko-KR')} {selectedTeeTime?.time}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="commissionType">수수료 유형</Label>
              <Select
                value={performanceData.commissionType}
                onValueChange={(value) => setPerformanceData({ ...performanceData, commissionType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">퍼센트</SelectItem>
                  <SelectItem value="FIXED">정액</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="commissionAmount">
                수수료 {performanceData.commissionType === 'PERCENTAGE' ? '(%)' : '(만원)'}
              </Label>
              <Input
                type="number"
                value={performanceData.commissionAmount}
                onChange={(e) => setPerformanceData({ ...performanceData, commissionAmount: e.target.value })}
                placeholder={performanceData.commissionType === 'PERCENTAGE' ? '10' : '5.0'}
                step={performanceData.commissionType === 'PERCENTAGE' ? '1' : '0.1'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="settlementMethod">정산 방식</Label>
              <Select
                value={performanceData.settlementMethod}
                onValueChange={(value) => setPerformanceData({ ...performanceData, settlementMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">계좌이체</SelectItem>
                  <SelectItem value="CASH">현금</SelectItem>
                  <SelectItem value="CARD">카드</SelectItem>
                  <SelectItem value="PENDING">보류</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">메모</Label>
              <Textarea
                value={performanceData.notes}
                onChange={(e) => setPerformanceData({ ...performanceData, notes: e.target.value })}
                placeholder="특이사항이나 메모를 입력하세요"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegistrationDialog(false)}>
              취소
            </Button>
            <Button onClick={handlePerformanceRegistration}>
              실적 등록
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}