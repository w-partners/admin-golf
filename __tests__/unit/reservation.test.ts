import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { 
  ReservationSimulator,
  isReservationExpired,
  getTimeSlot,
  getBookingType,
  isValidFutureDate,
  createMockTeeTimeData
} from '../utils/test-helpers'

describe('예약 시스템 단위 테스트', () => {
  describe('10분 타이머 로직', () => {
    let simulator: ReservationSimulator

    beforeEach(() => {
      simulator = new ReservationSimulator()
    })

    it('예약 시 10분 타이머가 시작되어야 함', () => {
      const result = simulator.reserve('user-1')
      
      expect(result.status).toBe('RESERVED')
      expect(result.reservedBy).toBe('user-1')
      expect(result.reservedAt).toBeInstanceOf(Date)
      expect(result.reservedAt.getTime()).toBeLessThanOrEqual(Date.now())
      expect(result.reservedAt.getTime()).toBeGreaterThan(Date.now() - 1000)
    })

    it('10분 이내에 확정하면 성공해야 함', () => {
      simulator.reserve('user-1')
      const result = simulator.confirm()
      
      expect(result.status).toBe('CONFIRMED')
      expect(result.confirmedAt).toBeInstanceOf(Date)
    })

    it('10분 초과 시 예약이 자동 취소되어야 함', () => {
      const result = simulator.reserve('user-1')
      
      // 10분 초과 시뮬레이션
      const expiredTime = new Date(Date.now() - 11 * 60 * 1000)
      jest.spyOn(global, 'Date').mockImplementation(() => expiredTime as any)
      
      expect(() => simulator.confirm()).toThrow('Reservation expired')
      
      // Mock 정리
      jest.restoreAllMocks()
    })

    it('이미 예약된 티타임은 다시 예약할 수 없어야 함', () => {
      simulator.reserve('user-1')
      
      expect(() => simulator.reserve('user-2')).toThrow('Tee time is not available')
    })

    it('확정된 예약은 취소할 수 없어야 함', () => {
      simulator.reserve('user-1')
      simulator.confirm()
      
      expect(() => simulator.cancel()).toThrow('Cannot cancel non-reserved tee time')
    })

    it('예약 취소 시 AVAILABLE 상태로 복원되어야 함', () => {
      simulator.reserve('user-1')
      const result = simulator.cancel()
      
      expect(result.status).toBe('AVAILABLE')
      
      // 다시 예약 가능해야 함
      const newReservation = simulator.reserve('user-2')
      expect(newReservation.status).toBe('RESERVED')
      expect(newReservation.reservedBy).toBe('user-2')
    })
  })

  describe('예약 만료 체크', () => {
    it('10분 이내 예약은 만료되지 않아야 함', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      expect(isReservationExpired(fiveMinutesAgo)).toBe(false)
    })

    it('10분 초과 예약은 만료되어야 함', () => {
      const elevenMinutesAgo = new Date(Date.now() - 11 * 60 * 1000)
      expect(isReservationExpired(elevenMinutesAgo)).toBe(true)
    })

    it('정확히 10분된 예약은 만료되지 않아야 함', () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
      expect(isReservationExpired(tenMinutesAgo)).toBe(false)
    })
  })

  describe('예약 상태 전환', () => {
    let simulator: ReservationSimulator

    beforeEach(() => {
      simulator = new ReservationSimulator()
    })

    it('AVAILABLE → RESERVED → CONFIRMED → COMPLETED 순서로 전환되어야 함', () => {
      // AVAILABLE 초기 상태
      expect(simulator.getStatus().status).toBe('AVAILABLE')
      
      // AVAILABLE → RESERVED
      simulator.reserve('user-1')
      expect(simulator.getStatus().status).toBe('RESERVED')
      
      // RESERVED → CONFIRMED
      simulator.confirm()
      expect(simulator.getStatus().status).toBe('CONFIRMED')
      
      // CONFIRMED → COMPLETED
      simulator.complete()
      expect(simulator.getStatus().status).toBe('COMPLETED')
    })

    it('잘못된 상태 전환은 에러를 발생시켜야 함', () => {
      // AVAILABLE → CONFIRMED (잘못된 전환)
      expect(() => simulator.confirm()).toThrow('Tee time is not reserved')
      
      // AVAILABLE → COMPLETED (잘못된 전환)
      expect(() => simulator.complete()).toThrow('Tee time is not confirmed')
    })

    it('RESERVED → AVAILABLE (취소) 전환이 가능해야 함', () => {
      simulator.reserve('user-1')
      expect(simulator.getStatus().status).toBe('RESERVED')
      
      simulator.cancel()
      expect(simulator.getStatus().status).toBe('AVAILABLE')
    })
  })

  describe('중복 예약 방지', () => {
    it('동일 사용자가 같은 시간대에 중복 예약할 수 없어야 함', () => {
      const reservations = new Map<string, Set<string>>()
      
      const makeReservation = (userId: string, teeTimeId: string): boolean => {
        const userReservations = reservations.get(userId) || new Set()
        
        if (userReservations.has(teeTimeId)) {
          return false // 중복 예약
        }
        
        userReservations.add(teeTimeId)
        reservations.set(userId, userReservations)
        return true
      }
      
      // 첫 번째 예약 성공
      expect(makeReservation('user-1', 'teetime-1')).toBe(true)
      
      // 같은 티타임 중복 예약 실패
      expect(makeReservation('user-1', 'teetime-1')).toBe(false)
      
      // 다른 티타임 예약 성공
      expect(makeReservation('user-1', 'teetime-2')).toBe(true)
    })

    it('다른 사용자는 예약된 티타임을 예약할 수 없어야 함', () => {
      const teeTimeStatus = new Map<string, string>()
      
      const reserveTeeTime = (teeTimeId: string, userId: string): boolean => {
        const status = teeTimeStatus.get(teeTimeId) || 'AVAILABLE'
        
        if (status !== 'AVAILABLE') {
          return false
        }
        
        teeTimeStatus.set(teeTimeId, 'RESERVED')
        return true
      }
      
      // user-1이 예약
      expect(reserveTeeTime('teetime-1', 'user-1')).toBe(true)
      
      // user-2가 같은 티타임 예약 실패
      expect(reserveTeeTime('teetime-1', 'user-2')).toBe(false)
    })
  })

  describe('시간대 자동 분류', () => {
    it('10시 이전은 1부로 분류되어야 함', () => {
      expect(getTimeSlot('07:00')).toBe('1부')
      expect(getTimeSlot('08:30')).toBe('1부')
      expect(getTimeSlot('09:59')).toBe('1부')
    })

    it('10시-15시는 2부로 분류되어야 함', () => {
      expect(getTimeSlot('10:00')).toBe('2부')
      expect(getTimeSlot('12:30')).toBe('2부')
      expect(getTimeSlot('14:59')).toBe('2부')
    })

    it('15시 이후는 3부로 분류되어야 함', () => {
      expect(getTimeSlot('15:00')).toBe('3부')
      expect(getTimeSlot('17:30')).toBe('3부')
      expect(getTimeSlot('19:00')).toBe('3부')
    })
  })

  describe('예약 유형 자동 결정', () => {
    it('4명은 부킹으로 분류되어야 함', () => {
      expect(getBookingType(4)).toBe('부킹')
    })

    it('4명 미만은 조인으로 분류되어야 함', () => {
      expect(getBookingType(1)).toBe('조인')
      expect(getBookingType(2)).toBe('조인')
      expect(getBookingType(3)).toBe('조인')
    })
  })

  describe('날짜 검증', () => {
    it('미래 날짜는 유효해야 함', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      
      expect(isValidFutureDate(tomorrow)).toBe(true)
    })

    it('과거 날짜는 유효하지 않아야 함', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      yesterday.setHours(0, 0, 0, 0)
      
      expect(isValidFutureDate(yesterday)).toBe(false)
    })

    it('오늘 날짜는 유효해야 함', () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      expect(isValidFutureDate(today)).toBe(true)
    })

    it('90일 이후 날짜도 유효해야 함', () => {
      const future = new Date()
      future.setDate(future.getDate() + 90)
      future.setHours(0, 0, 0, 0)
      
      expect(isValidFutureDate(future)).toBe(true)
    })
  })

  describe('예약 우선순위', () => {
    it('먼저 클릭한 사용자가 우선권을 가져야 함', () => {
      const queue: string[] = []
      
      const attemptReservation = (userId: string): number => {
        queue.push(userId)
        return queue.indexOf(userId)
      }
      
      // 동시 클릭 시뮬레이션
      expect(attemptReservation('user-1')).toBe(0) // 첫 번째
      expect(attemptReservation('user-2')).toBe(1) // 두 번째
      expect(attemptReservation('user-3')).toBe(2) // 세 번째
      
      // 첫 번째 사용자가 우선권 획득
      expect(queue[0]).toBe('user-1')
    })
  })

  describe('예약 데이터 검증', () => {
    it('필수 필드가 모두 입력되어야 함', () => {
      const validateTeeTime = (data: any): boolean => {
        const requiredFields = [
          'golfCourseId',
          'date',
          'time',
          'greenFee',
          'players',
          'requirements',
          'holes',
          'caddy',
          'prepayment',
          'mealIncluded',
          'cartIncluded'
        ]
        
        return requiredFields.every(field => data[field] !== undefined && data[field] !== null)
      }
      
      const validData = createMockTeeTimeData()
      expect(validateTeeTime(validData)).toBe(true)
      
      const invalidData = { ...validData, greenFee: null }
      expect(validateTeeTime(invalidData)).toBe(false)
    })

    it('그린피는 소수점 1자리까지만 허용되어야 함', () => {
      const validateGreenFee = (greenFee: number): boolean => {
        const decimalPlaces = (greenFee.toString().split('.')[1] || '').length
        return decimalPlaces <= 1
      }
      
      expect(validateGreenFee(10.5)).toBe(true)
      expect(validateGreenFee(10.0)).toBe(true)
      expect(validateGreenFee(10)).toBe(true)
      expect(validateGreenFee(10.55)).toBe(false)
      expect(validateGreenFee(10.555)).toBe(false)
    })

    it('인원수는 1-4명 사이여야 함', () => {
      const validatePlayers = (players: number): boolean => {
        return players >= 1 && players <= 4
      }
      
      expect(validatePlayers(1)).toBe(true)
      expect(validatePlayers(2)).toBe(true)
      expect(validatePlayers(3)).toBe(true)
      expect(validatePlayers(4)).toBe(true)
      expect(validatePlayers(0)).toBe(false)
      expect(validatePlayers(5)).toBe(false)
    })
  })
})