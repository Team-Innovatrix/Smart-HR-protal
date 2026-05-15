'use client'

import { useState, useCallback, useRef } from 'react'
import { useImage } from '../contexts/ImageContext'
import { ImageServiceConfig } from '../services/imageService'

interface UseImageUploadOptions {
  onUploadStart?: () => void
  onUploadComplete?: (success: boolean, result?: any) => void
  onUploadError?: (error: string) => void
  config?: ImageServiceConfig
}

interface UseImageUploadReturn {
  // State
  isUploading: boolean
  uploadProgress: number
  error: string | null
  success: string | null
  
  // Actions
  uploadFile: (file: File) => Promise<void>
  uploadFromInput: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  uploadFromDrop: (event: React.DragEvent) => Promise<void>
  clearMessages: () => void
  
  // File input ref
  fileInputRef: React.RefObject<HTMLInputElement | null>
  triggerFileInput: () => void
}

export const useImageUpload = (options: UseImageUploadOptions = {}): UseImageUploadReturn => {
  const { uploadImage, validateImageFile } = useImage()
  const { onUploadStart, onUploadComplete, onUploadError, config } = options
  
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const clearMessages = useCallback(() => {
    setError(null)
    setSuccess(null)
  }, [])

  const showMessage = useCallback((message: string, type: 'success' | 'error', duration: number = 3000) => {
    if (type === 'success') {
      setSuccess(message)
      setError(null)
    } else {
      setError(message)
      setSuccess(null)
    }
    
    // Auto-fade after duration
    setTimeout(() => {
      if (type === 'success') {
        setSuccess(null)
      } else {
        setError(null)
      }
    }, duration)
  }, [])

  const uploadFile = useCallback(async (file: File) => {
    // Validate file first
    const validation = validateImageFile(file, config)
    if (!validation.isValid) {
      const errorMsg = validation.error || 'Invalid file'
      setError(errorMsg)
      onUploadError?.(errorMsg)
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    clearMessages()
    onUploadStart?.()

    try {
      const result = await uploadImage(file, config)
      
      if (result.success) {
        showMessage('✓ Image uploaded successfully!', 'success')
        onUploadComplete?.(true, result)
      } else {
        const errorMsg = result.error || 'Upload failed'
        showMessage(errorMsg, 'error')
        onUploadError?.(errorMsg)
        onUploadComplete?.(false, result)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed'
      showMessage(errorMsg, 'error')
      onUploadError?.(errorMsg)
      onUploadComplete?.(false)
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }, [uploadImage, validateImageFile, config, onUploadStart, onUploadComplete, onUploadError, showMessage, clearMessages])

  const uploadFromInput = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await uploadFile(file)
    }
  }, [uploadFile])

  const uploadFromDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    const files = Array.from(event.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile) {
      await uploadFile(imageFile)
    } else {
      const errorMsg = 'Please drop a valid image file'
      setError(errorMsg)
      onUploadError?.(errorMsg)
    }
  }, [uploadFile, onUploadError])

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return {
    isUploading,
    uploadProgress,
    error,
    success,
    uploadFile,
    uploadFromInput,
    uploadFromDrop,
    clearMessages,
    fileInputRef,
    triggerFileInput,
  }
}
