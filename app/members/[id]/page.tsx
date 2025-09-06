"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, Users, Calendar, Trophy, Phone, Crown } from "lucide-react"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

const userUpdateSchema = z.object({
  name: z.string().min(2, "이름은 2자 이상이어야 합니다").max(50, "이름은 50자 이하여야 합니다"),
  phone: z.string().min(10, "올바른 연락처를 입력해주세요").regex(/^[0-9-+() ]+$/, "올바른 연락처 형식이 아닙니다"),
  accountType: z.enum([
    'SUPER_ADMIN',
    'ADMIN', 
    'TEAM_LEADER',
    'INTERNAL_MANAGER',
    'EXTERNAL_MANAGER', 
    'PARTNER',
    'GOLF_COURSE',
    'MEMBER'
  ], {
    errorMap: () => ({ message: "계정 유형을 선택해주세요" })
  }),
  isActive: z.boolean(),
  teamLeaderId: z.string().optional().nullable()
})

type UserUpdateFormData = z.infer<typeof userUpdateSchema>

interface User {
  id: string
  name: string
  phone: string
  accountType: string
  isActive: boolean
  createdAt: string
  lastLoginAt?: string
  teamId?: string
  team?: {
    id: string
    name: string
    leaderId: string
    leader: {
      name: string
    }
  }
  teamLead?: {
    id: string
    name: string
    members: Array<{
      id: string
      name: string
      phone: string
      isActive: boolean
    }>
  }
  _count: {
    teeTimes: number
    confirmedReservations: number
    performances: number
  }
  recentActivity?: Array<{
    id: string
    type: string
    description: string
    createdAt: string
  }>
}

interface Team {
  id: string
  name: string
  leaderId: string
  leader: {
    name: string
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

interface Props {
  params: {
    id: string
  }
}

export default function MemberDetailPage({ params }: Props) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [error, setError] = useState<string | null>(null)

  const form = useForm<UserUpdateFormData>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      name: "",
      phone: "",
      accountType: "MEMBER",
      isActive: true,
      teamLeaderId: null
    }
  })

  // 권한 체크
  const canEdit = session?.user?.accountType && 
    ['SUPER_ADMIN', 'ADMIN'].includes(session.user.accountType)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/login")
      return
    }
    
    if (!canEdit) {
      router.push("/unauthorized")
      return
    }
    
    fetchUser()
    fetchTeams()
  }, [session, status, router, params.id, canEdit])

  const fetchUser = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/users/${params.id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("사용자를 찾을 수 없습니다")
        }
        throw new Error("사용자 정보를 불러오는데 실패했습니다")
      }
      
      const data = await response.json()
      setUser(data.user)
      
      // 폼에 데이터 설정
      form.reset({
        name: data.user.name,
        phone: data.user.phone,
        accountType: data.user.accountType,
        isActive: data.user.isActive,
        teamLeaderId: data.user.team?.leaderId || null
      })
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다")
    } finally {
      setLoading(false)
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams")
      if (!response.ok) return
      
      const data = await response.json()
      setTeams(data.teams || [])
    } catch (error) {
      console.error("Fetch teams error:", error)
    }
  }

  const onSubmit = async (data: UserUpdateFormData) => {
    try {
      setSaving(true)
      
      const response = await fetch(`/api/users/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "사용자 수정에 실패했습니다")
      }

      const result = await response.json()
      setUser(result.user)
      
      toast.success("사용자 정보가 성공적으로 수정되었습니다")
      
    } catch (error) {
      console.error("User update error:", error)
      toast.error(error instanceof Error ? error.message : "사용자 수정에 실패했습니다")
    } finally {
      setSaving(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!session || !canEdit) {
    return null
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-800 mb-2">오류 발생</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={() => router.back()}>
                  돌아가기
                </Button>
                <Button onClick={fetchUser}>
                  다시 시도
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const watchedAccountType = form.watch("accountType")

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{user.name}</h1>
              <Badge className={accountTypeColors[user.accountType as keyof typeof accountTypeColors]}>
                {user.accountType === 'TEAM_LEADER' && <Crown className="h-3 w-3 mr-1" />}
                {accountTypeLabels[user.accountType as keyof typeof accountTypeLabels]}
              </Badge>
              <Badge variant={user.isActive ? "default" : "secondary"}>
                {user.isActive ? "활성" : "비활성"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-gray-600 mt-1">
              <Phone className="h-4 w-4" />
              {user.phone}
            </div>
          </div>
        </div>

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList>
            <TabsTrigger value="info">기본 정보</TabsTrigger>
            <TabsTrigger value="team">팀 정보</TabsTrigger>
            <TabsTrigger value="activity">활동 내역</TabsTrigger>
          </TabsList>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>기본 정보 수정</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* 이름 & 연락처 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>이름 *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>연락처 *</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    {/* 계정 유형 */}
                    <FormField
                      control={form.control}
                      name="accountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>계정 유형 *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(accountTypeLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 팀장 선택 */}
                    {watchedAccountType && !['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER'].includes(watchedAccountType) && teams.length > 0 && (
                      <FormField
                        control={form.control}
                        name="teamLeaderId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>소속 팀장 (선택사항)</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange(value || null)} 
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="팀장을 선택하세요" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">팀 없음</SelectItem>
                                {teams.map((team) => (
                                  <SelectItem key={team.id} value={team.leaderId}>
                                    {team.leader.name} ({team.name})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              팀장을 선택하면 해당 팀에 소속되며, 팀장이 이 사용자의 예약을 확정할 수 있습니다
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <Separator />

                    {/* 계정 상태 */}
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              계정 활성화
                            </FormLabel>
                            <FormDescription>
                              비활성화된 계정은 로그인할 수 없습니다
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* 제출 버튼 */}
                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="submit" disabled={saving}>
                        {saving ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-b-transparent" />
                            저장 중...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            저장하기
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle>팀 정보</CardTitle>
              </CardHeader>
              <CardContent>
                {user.teamLead ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-600" />
                      <h3 className="text-lg font-medium">팀장: {user.teamLead.name}</h3>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">팀원 목록 ({user.teamLead.members.length}명)</h4>
                      <div className="space-y-2">
                        {user.teamLead.members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="font-medium">{member.name}</div>
                              <div className="text-sm text-gray-500">{member.phone}</div>
                            </div>
                            <Badge variant={member.isActive ? "default" : "secondary"}>
                              {member.isActive ? "활성" : "비활성"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : user.team ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">소속 팀</h3>
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{user.team.name}</div>
                            <div className="text-sm text-gray-500">
                              팀장: {user.team.leader.name}
                            </div>
                          </div>
                          <Users className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      소속 팀이 없습니다
                    </h3>
                    <p className="text-gray-500">
                      이 사용자는 어떤 팀에도 소속되어 있지 않습니다
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 통계 카드 */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{user._count.teeTimes}</div>
                    <div className="text-sm text-gray-500">등록한 티타임</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{user._count.confirmedReservations}</div>
                    <div className="text-sm text-gray-500">확정한 예약</div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{user._count.performances}</div>
                    <div className="text-sm text-gray-500">등록한 실적</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle>계정 정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      가입일
                    </div>
                    <div>{format(new Date(user.createdAt), "PPP", { locale: ko })}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      최근 로그인
                    </div>
                    <div>
                      {user.lastLoginAt 
                        ? format(new Date(user.lastLoginAt), "PPP HH:mm", { locale: ko })
                        : "로그인 기록 없음"
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}