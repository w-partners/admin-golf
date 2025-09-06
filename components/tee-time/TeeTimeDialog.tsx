'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TeeTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const GOLF_COURSES = [
  { id: 1, name: '오라CC', region: '제주' },
  { id: 2, name: '라헨느CC', region: '제주' },
  { id: 3, name: '블랙스톤CC', region: '제주' },
  { id: 4, name: '파인비치CC', region: '경남' },
  { id: 5, name: '아난티코브CC', region: '경남' },
];

export function TeeTimeDialog({ open, onOpenChange, onSuccess }: TeeTimeDialogProps) {
  const [formData, setFormData] = useState({
    golfCourseId: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '07:00',
    greenFee: '',
    players: '4',
    requirements: '',
    holes: '18',
    caddie: true,
    deposit: '',
    mealIncluded: true,
    cartIncluded: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/tee-times', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          golfCourseId: parseInt(formData.golfCourseId),
          greenFee: parseFloat(formData.greenFee),
          players: parseInt(formData.players),
          holes: parseInt(formData.holes),
          deposit: formData.deposit ? parseFloat(formData.deposit) : 0,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        console.error('Failed to create tee time');
      }
    } catch (error) {
      console.error('Error creating tee time:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCourse = GOLF_COURSES.find(c => c.id.toString() === formData.golfCourseId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>티타임 등록</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 골프장 선택 */}
            <div className="space-y-2">
              <Label htmlFor="golfCourse">골프장 *</Label>
              <Select
                value={formData.golfCourseId}
                onValueChange={(value) => setFormData({ ...formData, golfCourseId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="골프장 선택" />
                </SelectTrigger>
                <SelectContent>
                  {GOLF_COURSES.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      [{course.region}] {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 지역 (자동 입력) */}
            <div className="space-y-2">
              <Label>지역</Label>
              <Input value={selectedCourse?.region || ''} disabled />
            </div>

            {/* 날짜 */}
            <div className="space-y-2">
              <Label htmlFor="date">날짜 *</Label>
              <div className="relative">
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
                <Calendar className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* 시간 */}
            <div className="space-y-2">
              <Label htmlFor="time">시간 *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>

            {/* 그린피 */}
            <div className="space-y-2">
              <Label htmlFor="greenFee">그린피 (만원) *</Label>
              <Input
                id="greenFee"
                type="number"
                step="0.1"
                placeholder="15.5"
                value={formData.greenFee}
                onChange={(e) => setFormData({ ...formData, greenFee: e.target.value })}
                required
              />
            </div>

            {/* 인원 */}
            <div className="space-y-2">
              <Label htmlFor="players">인원 *</Label>
              <Select
                value={formData.players}
                onValueChange={(value) => setFormData({ ...formData, players: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1명 (조인)</SelectItem>
                  <SelectItem value="2">2명 (조인)</SelectItem>
                  <SelectItem value="3">3명 (조인)</SelectItem>
                  <SelectItem value="4">4명 (부킹)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 홀 */}
            <div className="space-y-2">
              <Label htmlFor="holes">홀 *</Label>
              <Select
                value={formData.holes}
                onValueChange={(value) => setFormData({ ...formData, holes: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9">9홀</SelectItem>
                  <SelectItem value="18">18홀</SelectItem>
                  <SelectItem value="27">27홀</SelectItem>
                  <SelectItem value="36">36홀</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 선입금 */}
            <div className="space-y-2">
              <Label htmlFor="deposit">선입금 (만원)</Label>
              <Input
                id="deposit"
                type="number"
                step="0.1"
                placeholder="5.0"
                value={formData.deposit}
                onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
              />
            </div>
          </div>

          {/* 요청사항 */}
          <div className="space-y-2">
            <Label htmlFor="requirements">요청사항</Label>
            <Textarea
              id="requirements"
              placeholder="특별 요청사항을 입력하세요"
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              rows={3}
            />
          </div>

          {/* 체크박스 옵션들 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="caddie"
                checked={formData.caddie}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, caddie: checked as boolean })
                }
              />
              <Label htmlFor="caddie">캐디 포함</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="mealIncluded"
                checked={formData.mealIncluded}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, mealIncluded: checked as boolean })
                }
              />
              <Label htmlFor="mealIncluded">식사 포함</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="cartIncluded"
                checked={formData.cartIncluded}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, cartIncluded: checked as boolean })
                }
              />
              <Label htmlFor="cartIncluded">카트비 포함</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.golfCourseId || !formData.greenFee}>
              {isSubmitting ? '등록 중...' : '등록'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}