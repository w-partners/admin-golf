"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Phone, 
  Calendar, 
  Shield,
  UserCheck,
  UserX,
  Crown
} from "lucide-react"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

interface User {
  id: string
  name: string
  phone: string
  accountType: string
  isActive: boolean
  teamId?: string
  team?: {
    id: string
    name: string
    leaderId: string
  }
  teamLead?: {
    id: string
    name: string
    members: User[]
  }
  createdAt: string
  lastLoginAt?: string
  _count?: {
    teeTimes: number
    confirmedReservations: number
  }
}

const accountTypeLabels = {
  SUPER_ADMIN: '최고관리자',
  ADMIN: '관리자',
  TEAM_LEADER: '팀장',
  INTERNAL_MANAGER: '내부매니저',
  EXTERNAL_MANAGER: '외부매니저',
  PARTNER: '파트너',
  GOLF_COURSE: '골프장',
  MEMBER: '회원'
}

const accountTypeColors = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-red-100 text-red-800',
  TEAM_LEADER: 'bg-blue-100 text-blue-800',
  INTERNAL_MANAGER: 'bg-green-100 text-green-800',
  EXTERNAL_MANAGER: 'bg-yellow-100 text-yellow-800',
  PARTNER: 'bg-orange-100 text-orange-800',
  GOLF_COURSE: 'bg-gray-100 text-gray-800',
  MEMBER: 'bg-slate-100 text-slate-800'
}

export default function MembersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAccountType, setSelectedAccountType] = useState<string>("전체")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // 권한 체크 - 관리자 이상만 접근 가능
  const canManageUsers = session?.user?.accountType && 
    ['SUPER_ADMIN', 'ADMIN'].includes(session.user.accountType)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/login")
      return
    }
    
    if (!canManageUsers) {
      router.push("/unauthorized")
      return
    }
    
    fetchUsers()
  }, [session, status, router, canManageUsers])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/users")
      
      if (!response.ok) {
        throw new Error("사용자 목록을 불러오는데 실패했습니다")
      }
      
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error("Fetch users error:", error)
      toast.error(error instanceof Error ? error.message : "데이터 로딩 실패")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ isActive: !isActive })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "사용자 상태 변경에 실패했습니다")
      }

      toast.success(`사용자가 ${!isActive ? '활성화' : '비활성화'}되었습니다`)
      fetchUsers()
      
    } catch (error) {
      console.error("Toggle user active error:", error)
      toast.error(error instanceof Error ? error.message : "상태 변경 실패")
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    
    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "사용자 삭제에 실패했습니다")
      }
      
      toast.success("사용자가 성공적으로 삭제되었습니다")
      setShowDeleteDialog(false)
      setSelectedUser(null)
      fetchUsers()
      
    } catch (error) {
      console.error("Delete user error:", error)
      toast.error(error instanceof Error ? error.message : "사용자 삭제 실패")
    }
  }

  // 필터링 적용
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone.includes(searchTerm)
    const matchesAccountType = selectedAccountType === "전체" || user.accountType === selectedAccountType
    
    return matchesSearch && matchesAccountType
  })

  const getAccountTypeBadge = (accountType: string) => {
    return (
      <Badge className={accountTypeColors[accountType as keyof typeof accountTypeColors]}>
        {accountTypeLabels[accountType as keyof typeof accountTypeLabels]}
      </Badge>
    )
  }

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800">
        <UserCheck className="h-3 w-3 mr-1" />
        활성
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">
        <UserX className="h-3 w-3 mr-1" />
        비활성
      </Badge>
    )
  }

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!session || !canManageUsers) {
    return null
  }

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              회원 관리
            </h1>
            <p className="text-gray-600">시스템 사용자를 관리하고 권한을 설정합니다</p>
          </div>
          
          <Button 
            onClick={() => router.push("/members/new")}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            회원 추가
          </Button>
        </div>

        {/* 필터링 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">검색 및 필터</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="이름 또는 연락처 검색"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={selectedAccountType} onValueChange={setSelectedAccountType}>
                <SelectTrigger>
                  <SelectValue placeholder="계정 유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="전체">전체 유형</SelectItem>
                  {Object.entries(accountTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="text-sm text-gray-600 flex items-center">
                총 {filteredUsers.length}명
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 사용자 목록 */}
        <Card>
          <CardHeader>
            <CardTitle>사용자 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>이름</TableHead>
                    <TableHead>연락처</TableHead>
                    <TableHead>계정유형</TableHead>
                    <TableHead>팀 정보</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>가입일</TableHead>
                    <TableHead>최근접속</TableHead>
                    <TableHead>활동</TableHead>
                    <TableHead className="text-center">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-16">
                        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          사용자가 없습니다
                        </h3>
                        <p className="text-gray-500">
                          {searchTerm || selectedAccountType !== "전체"
                            ? "검색 조건에 맞는 사용자가 없습니다"
                            : "등록된 사용자가 없습니다"
                          }
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {user.accountType === 'TEAM_LEADER' && (
                              <Crown className="h-4 w-4 text-yellow-600" />
                            )}
                            {user.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4 text-gray-400" />
                            {user.phone}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getAccountTypeBadge(user.accountType)}
                        </TableCell>
                        <TableCell>
                          {user.team ? (
                            <div className="text-sm">
                              <div className="font-medium">{user.team.name}</div>
                              {user.team.leaderId === user.id && (
                                <div className="text-xs text-gray-500">팀장</div>
                              )}
                            </div>
                          ) : user.teamLead ? (
                            <div className="text-sm">
                              <div className="font-medium">{user.teamLead.name}</div>
                              <div className="text-xs text-gray-500">
                                팀원 {user.teamLead.members.length}명
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(user.isActive)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {format(new Date(user.createdAt), "M/d", { locale: ko })}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.lastLoginAt ? (
                            <div className="text-sm">
                              {format(new Date(user.lastLoginAt), "M/d HH:mm", { locale: ko })}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">없음</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div>티타임: {user._count?.teeTimes || 0}</div>
                            <div>예약: {user._count?.confirmedReservations || 0}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => router.push(`/members/${user.id}`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleToggleActive(user.id, user.isActive)}
                              className={user.isActive ? 'text-yellow-600' : 'text-green-600'}
                            >
                              {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </Button>
                            
                            {session.user.accountType === 'SUPER_ADMIN' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setShowDeleteDialog(true)
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 삭제 확인 다이얼로그 */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>사용자 삭제</DialogTitle>
              <DialogDescription>
                정말 "{selectedUser?.name}" 사용자를 삭제하시겠습니까?
                <br />
                <br />
                이 작업은 되돌릴 수 없으며, 해당 사용자의 모든 데이터가 삭제됩니다.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowDeleteDialog(false)
                  setSelectedUser(null)
                }}
              >
                취소
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteUser}
              >
                삭제
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}