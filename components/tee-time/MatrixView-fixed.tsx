'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MatrixTable } from './MatrixTable-simple';

export function MatrixView() {
  const [activeTab, setActiveTab] = useState('daily-booking');

  return (
    <div className="w-full bg-white rounded-lg shadow-sm">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily-booking">데일리부킹</TabsTrigger>
          <TabsTrigger value="daily-join">데일리조인</TabsTrigger>
          <TabsTrigger value="package-booking">패키지부킹</TabsTrigger>
          <TabsTrigger value="package-join">패키지조인</TabsTrigger>
        </TabsList>

        <TabsContent value="daily-booking" className="mt-4">
          <MatrixTable 
            teeTimeType="DAILY" 
            bookingType="BOOKING" 
            title="데일리 부킹 (4명)"
          />
        </TabsContent>

        <TabsContent value="daily-join" className="mt-4">
          <MatrixTable 
            teeTimeType="DAILY" 
            bookingType="JOIN" 
            title="데일리 조인 (1-3명)"
          />
        </TabsContent>

        <TabsContent value="package-booking" className="mt-4">
          <MatrixTable 
            teeTimeType="PACKAGE" 
            bookingType="BOOKING" 
            title="패키지 부킹 (4명)"
          />
        </TabsContent>

        <TabsContent value="package-join" className="mt-4">
          <MatrixTable 
            teeTimeType="PACKAGE" 
            bookingType="JOIN" 
            title="패키지 조인 (1-3명)"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}