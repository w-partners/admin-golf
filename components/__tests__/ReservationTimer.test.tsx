import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ReservationTimer } from '../tee-time/ReservationTimer'

// Mock timers
jest.useFakeTimers()

describe('ReservationTimer 컴포넌트', () => {
  const mockOnExpire = jest.fn()
  const defaultProps = {
    reservedAt: new Date(),
    onExpire: mockOnExpire,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.setSystemTime(new Date())
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('초기 렌더링 시 10분 카운트다운이 표시되어야 함', () => {
    render(<ReservationTimer {...defaultProps} />)
    
    expect(screen.getByText(/예약 유효시간/)).toBeInTheDocument()
    expect(screen.getByText(/10:00/)).toBeInTheDocument()
  })

  it('매 초마다 카운트다운이 감소해야 함', () => {
    render(<ReservationTimer {...defaultProps} />)
    
    expect(screen.getByText(/10:00/)).toBeInTheDocument()
    
    // 1초 경과
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(screen.getByText(/9:59/)).toBeInTheDocument()
    
    // 10초 더 경과
    act(() => {
      jest.advanceTimersByTime(10000)
    })
    expect(screen.getByText(/9:49/)).toBeInTheDocument()
  })

  it('5분 이하일 때 경고 스타일이 적용되어야 함', () => {
    render(<ReservationTimer {...defaultProps} />)
    
    // 5분 1초 경과 (4분 59초 남음)
    act(() => {
      jest.advanceTimersByTime(301000)
    })
    
    const timerElement = screen.getByText(/4:59/)
    expect(timerElement).toHaveClass('text-orange-500')
  })

  it('2분 이하일 때 위험 스타일이 적용되어야 함', () => {
    render(<ReservationTimer {...defaultProps} />)
    
    // 8분 1초 경과 (1분 59초 남음)
    act(() => {
      jest.advanceTimersByTime(481000)
    })
    
    const timerElement = screen.getByText(/1:59/)
    expect(timerElement).toHaveClass('text-red-500')
  })

  it('시간이 만료되면 onExpire 콜백이 호출되어야 함', async () => {
    render(<ReservationTimer {...defaultProps} />)
    
    // 10분 경과
    act(() => {
      jest.advanceTimersByTime(600000)
    })
    
    await waitFor(() => {
      expect(mockOnExpire).toHaveBeenCalledTimes(1)
    })
    
    expect(screen.getByText(/시간 만료/)).toBeInTheDocument()
  })

  it('컴포넌트 언마운트 시 타이머가 정리되어야 함', () => {
    const { unmount } = render(<ReservationTimer {...defaultProps} />)
    
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval')
    
    unmount()
    
    expect(clearIntervalSpy).toHaveBeenCalled()
  })

  it('이미 지난 예약 시간은 즉시 만료 처리되어야 함', () => {
    const pastTime = new Date(Date.now() - 11 * 60 * 1000) // 11분 전
    
    render(<ReservationTimer reservedAt={pastTime} onExpire={mockOnExpire} />)
    
    expect(screen.getByText(/시간 만료/)).toBeInTheDocument()
    expect(mockOnExpire).toHaveBeenCalledTimes(1)
  })

  it('프로그레스 바가 올바르게 표시되어야 함', () => {
    render(<ReservationTimer {...defaultProps} />)
    
    const progressBar = screen.getByRole('progressbar')
    expect(progressBar).toBeInTheDocument()
    expect(progressBar).toHaveAttribute('aria-valuenow', '100')
    
    // 3분 경과 (70% 남음)
    act(() => {
      jest.advanceTimersByTime(180000)
    })
    
    expect(progressBar).toHaveAttribute('aria-valuenow', '70')
  })

  it('일시정지/재개 기능이 작동해야 함', () => {
    const { rerender } = render(
      <ReservationTimer {...defaultProps} isPaused={false} />
    )
    
    expect(screen.getByText(/10:00/)).toBeInTheDocument()
    
    // 1초 경과
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(screen.getByText(/9:59/)).toBeInTheDocument()
    
    // 일시정지
    rerender(<ReservationTimer {...defaultProps} isPaused={true} />)
    
    // 5초 경과 (일시정지 상태이므로 시간 변화 없음)
    act(() => {
      jest.advanceTimersByTime(5000)
    })
    expect(screen.getByText(/9:59/)).toBeInTheDocument()
    
    // 재개
    rerender(<ReservationTimer {...defaultProps} isPaused={false} />)
    
    // 1초 경과
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    expect(screen.getByText(/9:58/)).toBeInTheDocument()
  })

  it('포맷이 올바르게 표시되어야 함', () => {
    render(<ReservationTimer {...defaultProps} />)
    
    // 초기: 10:00
    expect(screen.getByText(/10:00/)).toBeInTheDocument()
    
    // 1분 5초 경과: 08:55
    act(() => {
      jest.advanceTimersByTime(65000)
    })
    expect(screen.getByText(/8:55/)).toBeInTheDocument()
    
    // 9분 55초 더 경과: 00:05
    act(() => {
      jest.advanceTimersByTime(535000)
    })
    expect(screen.getByText(/0:05/)).toBeInTheDocument()
  })
})