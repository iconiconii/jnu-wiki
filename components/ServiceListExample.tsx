'use client'

import React, { useState, useEffect } from 'react'
import { ServiceListPage } from './ServiceListPage'
import { Service } from '@/types/services'

// 示例数据
const mockServices: Service[] = [
  {
    id: '1',
    title: '学习312',
    description: '范德萨发的',
    href: 'https://example.com',
    image: '/images/default-service.svg',
    status: 'active',
    tags: ['AI', '学习'],
    rating: 4.8,
    featured: false,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    title: 'JNU周边美食',
    description: '好吃的美食',
    href: 'https://food.example.com',
    image: '/images/default-service.svg',
    status: 'active',
    tags: ['美食', '生活'],
    rating: 4.5,
    featured: true,
    created_at: '2024-01-14T15:30:00Z',
  },
  {
    id: '3',
    title: 'AI提效篇',
    description: '一些使用AI提效的工具和个人心得',
    href: 'https://ai.example.com',
    image: '/images/default-service.svg',
    status: 'active',
    tags: ['AI', '工具'],
    rating: 4.9,
    featured: true,
    created_at: '2024-01-13T09:15:00Z',
  },
  {
    id: '4',
    title: '课程助手',
    description: '帮助学生更好地管理课程和作业',
    href: '',
    image: '/images/default-service.svg',
    status: 'coming-soon',
    tags: ['教育', '工具'],
    rating: undefined,
    featured: false,
    created_at: '2024-01-12T14:20:00Z',
  },
  {
    id: '5',
    title: '图书馆预约',
    description: '快速预约图书馆座位和资源',
    href: 'https://library.example.com',
    image: '/images/default-service.svg',
    status: 'maintenance',
    tags: ['教育', '预约'],
    rating: 4.2,
    featured: false,
    created_at: '2024-01-11T11:45:00Z',
  },
  {
    id: '6',
    title: '校园导航',
    description: '帮助新生和访客快速找到校园内的各个地点',
    href: 'https://nav.example.com',
    image: '/images/default-service.svg',
    status: 'active',
    tags: ['导航', '校园'],
    rating: 4.6,
    featured: false,
    created_at: '2024-01-10T08:30:00Z',
  },
]

export function ServiceListExample() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // 模拟数据加载
  useEffect(() => {
    const loadServices = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1500))

        // 模拟随机错误 (10% 概率)
        if (Math.random() < 0.1) {
          throw new Error('网络连接超时')
        }

        setServices(mockServices)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    loadServices()
  }, [])

  const handleServiceAccess = (service: Service) => {
    console.log('Accessing service:', service.title)
    if (service.href && service.href !== 'https://example.com') {
      window.open(service.href, '_blank', 'noopener,noreferrer')
    } else {
      alert(`正在访问: ${service.title}`)
    }
  }

  const handleRetry = () => {
    window.location.reload()
  }

  const handleCreateService = () => {
    window.open('/submit', '_blank')
  }

  return (
    <ServiceListPage
      services={services}
      isLoading={isLoading}
      error={error}
      onServiceAccess={handleServiceAccess}
      onRetry={handleRetry}
      onCreateService={handleCreateService}
    />
  )
}
