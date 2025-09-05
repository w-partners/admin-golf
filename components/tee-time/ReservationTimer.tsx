'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Clock } from 'lucide-react'

interface ReservationTimerProps {
  reservedAt: string
  onExpiry: () => void
  durationMinutes?: number
}

export function ReservationTimer({ 
  reservedAt, 
  onExpiry, 
  durationMinutes = 10 
}: ReservationTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const reservedTime = new Date(reservedAt).getTime()
      const expiryTime = reservedTime + (durationMinutes * 60 * 1000)
      const remaining = expiryTime - now
      
      return Math.max(0, remaining)
    }

    const updateTimer = () => {
      const remaining = calculateTimeLeft()
      setTimeLeft(remaining)

      if (remaining <= 0 && !isExpired) {
        setIsExpired(true)
        onExpiry()
      }
    }

    // 즉시 업데이트
    updateTimer()

    // 1초마다 업데이트
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [reservedAt, durationMinutes, onExpiry, isExpired])

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const getTimeLeftPercentage = () => {
    const totalDuration = durationMinutes * 60 * 1000
    const remaining = timeLeft
    return (remaining / totalDuration) * 100
  }

  const getTimerColor = () => {
    const percentage = getTimeLeftPercentage()
    if (percentage <= 20) return 'destructive' // 빨간색 - 위험
    if (percentage <= 50) return 'warning' // 주황색 - 경고
    return 'default' // 기본색 - 안전
  }

  const getTimerStyle = () => {
    const percentage = getTimeLeftPercentage()
    if (percentage <= 20) {
      return 'bg-red-100 text-red-700 border-red-200 animate-pulse'
    }
    if (percentage <= 50) {
      return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    }
    return 'bg-blue-100 text-blue-700 border-blue-200'
  }

  if (isExpired) {
    return (
      <Badge className="bg-gray-100 text-gray-600 border-gray-200">
        <AlertCircle className="h-3 w-3 mr-1" />
        만료됨
      </Badge>
    )
  }

  const percentage = getTimeLeftPercentage()
  
  return (
    <div className="flex flex-col space-y-1">
      {/* 타이머 배지 */}
      <div className={`text-xs px-2 py-1 rounded border ${getTimerStyle()}`}>
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span className="font-mono font-medium">
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>
      
      {/* 프로그레스 바 */}
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div 
          className={`h-1 rounded-full transition-all duration-1000 ${
            percentage <= 20 ? 'bg-red-500' :
            percentage <= 50 ? 'bg-yellow-500' : 
            'bg-blue-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* 경고 메시지 */}
      {percentage <= 20 && (
        <div className="text-xs text-red-600 font-medium flex items-center space-x-1">
          <AlertCircle className="h-3 w-3" />
          <span>곧 만료됩니다!</span>
        </div>
      )}
    </div>
  )
}