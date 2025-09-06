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
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Save, UserPlus } from "lucide-react"
import { toast } from "react-hot-toast"
import { ACCOUNT_TYPE_LABELS, getAccountTypeLabel } from '@/constants/userTypes'

const userSchema = z.object({
  name: z.string().min(2, "이름은 2자 이상이어야 합니다").max(50, "이름은 50자 이하여야 합니다"),
  phone: z.string().min(10, "올바른 연락처를 입력해주세요").regex(/^[0-9-+() ]+$/, "올바른 연락처 형식이 아닙니다"),
  password: z.string().min(4, "비밀번호는 4자 이상이어야 합니다"),
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
  isActive: z.boolean().default(true),
  teamLeaderId: z.string().optional()
})

type UserFormData = z.infer<typeof userSchema>

interface Team {
  id: string
  name: string
  leaderId: string
  leader: {
    name: string
  }
}


const accountTypeDescriptions = {
  SUPER_ADMIN: '모든 기능에 접근 가능한 최고 관리자',
  ADMIN: '전체 시스템 관리 권한',
  TEAM_LEADER: '팀 관리 및 팀원 예약 확정 권한',
  INTERNAL_MANAGER: '티타임 등록/수정 및 실적 등록 권한',
  EXTERNAL_MANAGER: '매니저와 동일한 권한',
  PARTNER: '매니저와 동일한 권한',
  GOLF_COURSE: '자신의 골프장 티타임만 조회/수정',
  MEMBER: '티타임 조회만 가능'
}

export default function NewMemberPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [teams, setTeams] = useState<Team[]>([])

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      phone: "",
      password: "",
      accountType: "MEMBER",
      isActive: true,
      teamLeaderId: undefined
    }
  })

  const watchedAccountType = form.watch("accountType")

  // 권한 체크
  if (status === "loading") {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">로딩 중...</div>
      </div>
    )
  }

  if (!session) {
    router.push("/login")
    return null
  }

  if (!['SUPER_ADMIN', 'ADMIN'].includes(session.user.accountType)) {
    router.push("/unauthorized")
    return null
  }

  useEffect(() => {
    // 팀 정보 로드 (팀원을 추가할 때 팀장을 선택하기 위해)
    fetchTeams()
  }, [])

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

  const onSubmit = async (data: UserFormData) => {
    try {
      setLoading(true)
      
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "회원 등록에 실패했습니다")
      }

      const result = await response.json()
      
      toast.success("회원이 성공적으로 등록되었습니다")
      router.push("/members")
      
    } catch (error) {
      console.error("User registration error:", error)
      toast.error(error instanceof Error ? error.message : "회원 등록에 실패했습니다")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 max-w-2xl">
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
          <div>
            <h1 className="text-2xl font-bold">회원 추가</h1>
            <p className="text-gray-600">새로운 시스템 사용자를 등록합니다</p>
          </div>
        </div>

        {/* 등록 폼 */}
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
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
                          <Input placeholder="홍길동" {...field} />
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
                          <Input placeholder="010-1234-5678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 비밀번호 */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>초기 비밀번호 *</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="사용자가 로그인 후 변경할 수 있습니다" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        사용자는 첫 로그인 후 비밀번호를 변경할 수 있습니다
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* 계정 유형 */}
                <FormField
                  control={form.control}
                  name="accountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>계정 유형 *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="계정 유형을 선택하세요" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {watchedAccountType && (
                        <FormDescription>
                          {accountTypeDescriptions[watchedAccountType as keyof typeof accountTypeDescriptions]}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 팀장 선택 (팀원인 경우에만 표시) */}
                {watchedAccountType && !['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER'].includes(watchedAccountType) && teams.length > 0 && (
                  <FormField
                    control={form.control}
                    name="teamLeaderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>소속 팀장 (선택사항)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    취소
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-b-transparent" />
                        등록 중...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        회원 등록
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* 권한별 안내 */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 mb-3">계정 유형별 권한 안내</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div><strong>{getAccountTypeLabel('SUPER_ADMIN')}:</strong> 모든 기능 + 골프장 등록</div>
                <div><strong>관리자:</strong> 모든 기능 접근</div>
                <div><strong>팀장:</strong> 팀 관리 + 팀원 예약 확정</div>
                <div><strong>내부매니저:</strong> 티타임 등록/수정, 실적 등록</div>
                <div><strong>외부매니저:</strong> 매니저와 동일 권한</div>
                <div><strong>파트너:</strong> 매니저와 동일 권한</div>
                <div><strong>골프장:</strong> 자신의 골프장 티타임만 조회/수정</div>
                <div><strong>회원:</strong> 티타임 조회만</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}