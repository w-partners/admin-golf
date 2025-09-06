'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, MapPin, Phone, Edit, Trash2, Home } from 'lucide-react';

export default function GolfCoursesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [golfCourses, setGolfCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('ALL');

  // Check permission
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/login');
      return;
    }
  }, [session, status, router]);

  // Fetch golf courses
  useEffect(() => {
    fetchGolfCourses();
  }, []);

  const fetchGolfCourses = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedRegion !== 'ALL') {
        params.append('region', selectedRegion);
      }
      
      const response = await fetch(`/api/golf-courses?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');
      
      const data = await response.json();
      setGolfCourses(data);
    } catch (error) {
      toast({
        title: '오류',
        description: '골프장 목록을 불러오는데 실패했습니다.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`정말 "${name}" 골프장을 삭제하시겠습니까?`)) return;

    try {
      const response = await fetch(`/api/golf-courses?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      toast({
        title: '성공',
        description: '골프장이 삭제되었습니다.'
      });
      fetchGolfCourses();
    } catch (error: unknown) {
      toast({
        title: '오류',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const regionNames: Record<string, string> = {
    'ALL': '전체',
    '강원': '강원',
    '경상': '경상',
    '충청': '충청',
    '전라': '전라',
    '제주': '제주',
    '경북': '경북',
    '경남': '경남',
    '경동': '경동'
  };

  const statusColors: Record<string, string> = {
    'API': 'bg-green-500',
    'MANUAL': 'bg-blue-500',
    'PENDING': 'bg-yellow-500'
  };

  const statusNames: Record<string, string> = {
    'API': 'API연동',
    'MANUAL': '수동',
    'PENDING': '대기'
  };

  // Filter golf courses
  const filteredCourses = golfCourses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = selectedRegion === 'ALL' || course.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  const canManage = session?.user.accountType === 'SUPER_ADMIN' || 
                    session?.user.accountType === 'ADMIN';

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <Home className="w-6 h-6" />
              골프장 관리
            </CardTitle>
            {canManage && (
              <Button onClick={() => router.push('/golf-courses/new')}>
                <Plus className="w-4 h-4 mr-2" />
                골프장 등록
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="골프장명 또는 주소로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(regionNames).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-10">로딩 중...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">번호</TableHead>
                    <TableHead>지역</TableHead>
                    <TableHead>골프장명</TableHead>
                    <TableHead>주소</TableHead>
                    <TableHead>연락처</TableHead>
                    <TableHead>운영상태</TableHead>
                    <TableHead className="text-center">티타임</TableHead>
                    {canManage && <TableHead className="text-center">관리</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCourses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canManage ? 8 : 7} className="text-center py-10">
                        등록된 골프장이 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCourses.map((course, index) => (
                      <TableRow key={course.id}>
                        <TableCell>{course.orderIndex || index + 1}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {regionNames[course.region]}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{course.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            {course.address}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            {course.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[course.operationStatus]}>
                            {statusNames[course.operationStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">
                            {course._count?.teeTimes || 0}
                          </Badge>
                        </TableCell>
                        {canManage && (
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => router.push(`/golf-courses/${course.id}`)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {session?.user.accountType === 'SUPER_ADMIN' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDelete(course.id, course.name)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Summary */}
          <div className="mt-4 text-sm text-gray-500">
            총 {filteredCourses.length}개 골프장
          </div>
        </CardContent>
      </Card>
    </div>
  );
}