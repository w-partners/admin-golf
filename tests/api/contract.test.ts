import { describe, it, expect, beforeAll, afterAll } from '@playwright/test'
import SwaggerParser from '@apidevtools/swagger-parser'
import { z } from 'zod'
import type { OpenAPIV3 } from 'openapi-types'

// OpenAPI 스펙 검증
describe('API Contract Tests', () => {
  let apiSpec: OpenAPIV3.Document

  beforeAll(async () => {
    // OpenAPI 스펙 파싱 및 검증
    apiSpec = await SwaggerParser.validate('./api/openapi.yaml') as OpenAPIV3.Document
  })

  describe('OpenAPI Specification', () => {
    it('should have valid OpenAPI specification', () => {
      expect(apiSpec).toBeDefined()
      expect(apiSpec.openapi).toMatch(/^3\./)
      expect(apiSpec.info).toBeDefined()
      expect(apiSpec.info.title).toBe('Golf Course Reservation Management System API')
      expect(apiSpec.info.version).toBe('1.0.0')
    })

    it('should have required servers configuration', () => {
      expect(apiSpec.servers).toBeDefined()
      expect(apiSpec.servers).toHaveLength(2)
      expect(apiSpec.servers?.[0].url).toContain('localhost')
      expect(apiSpec.servers?.[1].url).toContain('api.golfadmin.com')
    })

    it('should have security schemes defined', () => {
      expect(apiSpec.components?.securitySchemes).toBeDefined()
      expect(apiSpec.components?.securitySchemes?.bearerAuth).toBeDefined()
      expect(apiSpec.components?.securitySchemes?.bearerAuth).toMatchObject({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      })
    })

    it('should have all required tags', () => {
      const requiredTags = ['Auth', 'Users', 'Teams', 'GolfCourses', 'TeeTimes', 'Performance']
      const specTags = apiSpec.tags?.map(tag => tag.name) || []
      
      requiredTags.forEach(tag => {
        expect(specTags).toContain(tag)
      })
    })
  })

  describe('Critical Endpoints', () => {
    it('should have authentication endpoints', () => {
      expect(apiSpec.paths['/auth/login']).toBeDefined()
      expect(apiSpec.paths['/auth/login']?.post).toBeDefined()
      expect(apiSpec.paths['/auth/logout']).toBeDefined()
      expect(apiSpec.paths['/auth/logout']?.post).toBeDefined()
      expect(apiSpec.paths['/auth/session']).toBeDefined()
      expect(apiSpec.paths['/auth/session']?.get).toBeDefined()
    })

    it('should have 10-minute timer endpoints', () => {
      expect(apiSpec.paths['/tee-times/reserve']).toBeDefined()
      expect(apiSpec.paths['/tee-times/reserve']?.post).toBeDefined()
      expect(apiSpec.paths['/tee-times/confirm']).toBeDefined()
      expect(apiSpec.paths['/tee-times/confirm']?.post).toBeDefined()
      expect(apiSpec.paths['/tee-times/cancel']).toBeDefined()
      expect(apiSpec.paths['/tee-times/cancel']?.post).toBeDefined()
      expect(apiSpec.paths['/tee-times/timer-status/{id}']).toBeDefined()
      expect(apiSpec.paths['/tee-times/timer-status/{id}']?.get).toBeDefined()
    })

    it('should have matrix view endpoint', () => {
      expect(apiSpec.paths['/tee-times/matrix']).toBeDefined()
      expect(apiSpec.paths['/tee-times/matrix']?.get).toBeDefined()
      
      const matrixEndpoint = apiSpec.paths['/tee-times/matrix']?.get
      expect(matrixEndpoint?.parameters).toBeDefined()
      expect(matrixEndpoint?.responses?.['200']).toBeDefined()
    })

    it('should have performance management endpoints', () => {
      expect(apiSpec.paths['/performance/complete']).toBeDefined()
      expect(apiSpec.paths['/performance/complete']?.post).toBeDefined()
      expect(apiSpec.paths['/performance/summary']).toBeDefined()
      expect(apiSpec.paths['/performance/summary']?.get).toBeDefined()
      expect(apiSpec.paths['/performance/stats']).toBeDefined()
      expect(apiSpec.paths['/performance/stats']?.get).toBeDefined()
    })
  })

  describe('Error Response Standards', () => {
    it('should have standardized error responses', () => {
      const errorSchema = apiSpec.components?.schemas?.ErrorResponse as any
      expect(errorSchema).toBeDefined()
      expect(errorSchema.required).toContain('code')
      expect(errorSchema.required).toContain('message')
      expect(errorSchema.properties?.code).toBeDefined()
      expect(errorSchema.properties?.message).toBeDefined()
      expect(errorSchema.properties?.details).toBeDefined()
    })

    it('should have validation error schema', () => {
      const validationSchema = apiSpec.components?.schemas?.ValidationError as any
      expect(validationSchema).toBeDefined()
      expect(validationSchema.required).toContain('code')
      expect(validationSchema.required).toContain('message')
      expect(validationSchema.required).toContain('errors')
      expect(validationSchema.properties?.errors?.type).toBe('array')
    })

    it('should use standard HTTP status codes', () => {
      const responses = apiSpec.components?.responses
      expect(responses?.BadRequestError).toBeDefined()
      expect(responses?.UnauthorizedError).toBeDefined()
      expect(responses?.ForbiddenError).toBeDefined()
      expect(responses?.NotFoundError).toBeDefined()
      expect(responses?.ConflictError).toBeDefined()
      expect(responses?.InternalServerError).toBeDefined()
    })
  })

  describe('Pagination Standards', () => {
    it('should have pagination parameters', () => {
      const paginationSchema = apiSpec.components?.schemas?.Pagination as any
      expect(paginationSchema).toBeDefined()
      expect(paginationSchema.properties?.page).toBeDefined()
      expect(paginationSchema.properties?.limit).toBeDefined()
      expect(paginationSchema.properties?.total).toBeDefined()
      expect(paginationSchema.properties?.totalPages).toBeDefined()
    })

    it('should have standard query parameters', () => {
      const parameters = apiSpec.components?.parameters
      expect(parameters?.PageParam).toBeDefined()
      expect(parameters?.LimitParam).toBeDefined()
      expect(parameters?.SortParam).toBeDefined()
    })
  })

  describe('Business Logic Validation', () => {
    it('should enforce time slot classification', () => {
      const timeSlotEnum = apiSpec.components?.schemas?.TimeSlot as any
      expect(timeSlotEnum).toBeDefined()
      expect(timeSlotEnum.enum).toEqual(['1부', '2부', '3부'])
    })

    it('should enforce booking type classification', () => {
      const bookingTypeEnum = apiSpec.components?.schemas?.BookingType as any
      expect(bookingTypeEnum).toBeDefined()
      expect(bookingTypeEnum.enum).toEqual(['BOOKING', 'JOIN'])
    })

    it('should have 8 regions defined', () => {
      const regionEnum = apiSpec.components?.schemas?.Region as any
      expect(regionEnum).toBeDefined()
      expect(regionEnum.enum).toHaveLength(8)
      expect(regionEnum.enum).toEqual([
        '제주', '경기', '강원', '충청', '호남', '영남', '경상', '기타'
      ])
    })

    it('should have 8 account types defined', () => {
      const accountTypeEnum = apiSpec.components?.schemas?.AccountType as any
      expect(accountTypeEnum).toBeDefined()
      expect(accountTypeEnum.enum).toHaveLength(8)
      expect(accountTypeEnum.enum).toContain('SUPER_ADMIN')
      expect(accountTypeEnum.enum).toContain('MEMBER')
    })

    it('should validate player count constraints', () => {
      const createTeeTimeSchema = apiSpec.components?.schemas?.CreateTeeTimeRequest as any
      const playerCountProp = createTeeTimeSchema?.properties?.playerCount
      expect(playerCountProp).toBeDefined()
      expect(playerCountProp.minimum).toBe(1)
      expect(playerCountProp.maximum).toBe(4)
    })

    it('should have timer response with expiry information', () => {
      const timerStatusSchema = apiSpec.components?.schemas?.TimerStatusResponse as any
      expect(timerStatusSchema).toBeDefined()
      expect(timerStatusSchema.properties?.expiresAt).toBeDefined()
      expect(timerStatusSchema.properties?.remainingSeconds).toBeDefined()
      expect(timerStatusSchema.properties?.isExpired).toBeDefined()
    })
  })

  describe('Matrix View Contract', () => {
    it('should have proper matrix data structure', () => {
      const matrixViewResponse = apiSpec.components?.schemas?.MatrixViewResponse as any
      expect(matrixViewResponse).toBeDefined()
      expect(matrixViewResponse.properties?.matrixData).toBeDefined()
      expect(matrixViewResponse.properties?.dateColumns).toBeDefined()
      expect(matrixViewResponse.properties?.summary).toBeDefined()
    })

    it('should have time slot counts in date matrix', () => {
      const dateMatrix = apiSpec.components?.schemas?.DateMatrix as any
      expect(dateMatrix).toBeDefined()
      expect(dateMatrix.properties?.timeSlot1).toBeDefined()
      expect(dateMatrix.properties?.timeSlot2).toBeDefined()
      expect(dateMatrix.properties?.timeSlot3).toBeDefined()
      expect(dateMatrix.properties?.total).toBeDefined()
    })

    it('should support 90-day date range', () => {
      const matrixParams = apiSpec.paths['/tee-times/matrix']?.get?.parameters as any[]
      const daysParam = matrixParams?.find(p => p.name === 'days')
      expect(daysParam).toBeDefined()
      expect(daysParam?.schema?.maximum).toBe(90)
      expect(daysParam?.schema?.default).toBe(90)
    })
  })

  describe('Performance Contract', () => {
    it('should track revenue calculations', () => {
      const performanceSchema = apiSpec.components?.schemas?.Performance as any
      expect(performanceSchema).toBeDefined()
      expect(performanceSchema.properties?.actualPlayerCount).toBeDefined()
      expect(performanceSchema.properties?.actualGreenFee).toBeDefined()
      expect(performanceSchema.properties?.revenue).toBeDefined()
    })

    it('should support performance statistics grouping', () => {
      const statsParams = apiSpec.paths['/performance/stats']?.get?.parameters as any[]
      const groupByParam = statsParams?.find(p => p.name === 'groupBy')
      expect(groupByParam).toBeDefined()
      expect(groupByParam?.schema?.enum).toEqual(['manager', 'team', 'golfCourse', 'region'])
    })

    it('should support time period analysis', () => {
      const statsParams = apiSpec.paths['/performance/stats']?.get?.parameters as any[]
      const periodParam = statsParams?.find(p => p.name === 'period')
      expect(periodParam).toBeDefined()
      expect(periodParam?.schema?.enum).toEqual(['daily', 'weekly', 'monthly', 'yearly'])
    })
  })
})

// Request/Response 스키마 검증
describe('Schema Validation Tests', () => {
  describe('Phone Number Validation', () => {
    const phoneNumberRegex = /^010[0-9]{8}$/

    it('should validate correct phone number format', () => {
      expect('01012345678').toMatch(phoneNumberRegex)
      expect('01099999999').toMatch(phoneNumberRegex)
      expect('01000000000').toMatch(phoneNumberRegex)
    })

    it('should reject invalid phone number formats', () => {
      expect('02012345678').not.toMatch(phoneNumberRegex)
      expect('0101234567').not.toMatch(phoneNumberRegex)
      expect('010123456789').not.toMatch(phoneNumberRegex)
      expect('010-1234-5678').not.toMatch(phoneNumberRegex)
    })
  })

  describe('Time Format Validation', () => {
    const timeRegex = /^([01][0-9]|2[0-3]):[0-5][0-9]$/

    it('should validate correct time format', () => {
      expect('00:00').toMatch(timeRegex)
      expect('09:30').toMatch(timeRegex)
      expect('14:45').toMatch(timeRegex)
      expect('23:59').toMatch(timeRegex)
    })

    it('should reject invalid time formats', () => {
      expect('24:00').not.toMatch(timeRegex)
      expect('12:60').not.toMatch(timeRegex)
      expect('9:30').not.toMatch(timeRegex)
      expect('14:5').not.toMatch(timeRegex)
      expect('14:30:00').not.toMatch(timeRegex)
    })
  })

  describe('Date Format Validation', () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/

    it('should validate correct date format', () => {
      expect('2024-01-01').toMatch(dateRegex)
      expect('2024-12-31').toMatch(dateRegex)
      expect('2025-06-15').toMatch(dateRegex)
    })

    it('should reject invalid date formats', () => {
      expect('2024/01/01').not.toMatch(dateRegex)
      expect('01-01-2024').not.toMatch(dateRegex)
      expect('2024-1-1').not.toMatch(dateRegex)
      expect('20240101').not.toMatch(dateRegex)
    })
  })

  describe('Sort Parameter Validation', () => {
    const sortRegex = /^[a-zA-Z]+:(asc|desc)$/

    it('should validate correct sort format', () => {
      expect('date:asc').toMatch(sortRegex)
      expect('name:desc').toMatch(sortRegex)
      expect('createdAt:asc').toMatch(sortRegex)
      expect('greenFee:desc').toMatch(sortRegex)
    })

    it('should reject invalid sort formats', () => {
      expect('date').not.toMatch(sortRegex)
      expect('date:ascending').not.toMatch(sortRegex)
      expect('date-asc').not.toMatch(sortRegex)
      expect('date:asc:name:desc').not.toMatch(sortRegex)
    })
  })
})