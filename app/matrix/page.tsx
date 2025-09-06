'use client';

import { useState, useEffect } from 'react';
import { MatrixView } from '@/components/tee-time/MatrixView-fixed';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import { TeeTimeDialog } from '@/components/tee-time/TeeTimeDialog';
 

export default function MatrixPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-[1920px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">골프장 예약 관리 시스템</h1>
              <p className="text-sm text-gray-500 mt-1">실시간 티타임 현황 - 엑셀 뷰</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                새로고침
              </Button>
              <Button
                size="sm"
                onClick={() => setShowDialog(true)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                티타임 등록
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Matrix View 컴포넌트 */}
      <div className="max-w-[1920px] mx-auto p-4">
        <MatrixView key={refreshKey} />
      </div>

      {/* 티타임 등록 다이얼로그 */}
      {showDialog && (
        <TeeTimeDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          onSuccess={() => {
            setShowDialog(false);
            handleRefresh();
          }}
        />
      )}
    </div>
  );
}