'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { 
  CameraIcon, 
  XMarkIcon, 
  CloudArrowUpIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'
import { useImageUpload } from '@/lib/hooks/useImageUpload'
import { ImageServiceConfig } from '@/lib/services/imageService'

interface GlobalImageUploadProps {
  currentImageUrl?: string
  onImageChange: (imageUrl: string | null) => void
  onUploadStart?: () => void
  onUploadComplete?: (success: boolean, result?: any) => void
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  disabled?: boolean
  config?: ImageServiceConfig
  showPreview?: boolean
  showProgress?: boolean
  placeholder?: string
}

const GlobalImageUpload: React.FC<GlobalImageUploadProps> = ({
  currentImageUrl,
  onImageChange,
  onUploadStart,
  onUploadComplete,
  size = 'md',
  className = '',
  disabled = false,
  config = {},
  showPreview = true,
  showProgress = true,
  placeholder = 'Upload Photo'
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || '/api/image/logo.png')
  const [imageLoadError, setImageLoadError] = useState(false)
  
  // Update previewUrl when currentImageUrl changes
  React.useEffect(() => {
    setPreviewUrl(currentImageUrl || '/api/image/logo.png')
  }, [currentImageUrl])
  
  const {
    isUploading,
    uploadProgress,
    error,
    success,
    uploadFile,
    clearMessages,
    fileInputRef,
    triggerFileInput,
  } = useImageUpload({
    onUploadStart,
    onUploadComplete: (success, result) => {
      if (success && result?.imageUrl) {
        setPreviewUrl(result.imageUrl)
        onImageChange(result.imageUrl)
      }
      onUploadComplete?.(success, result)
    },
    config
  })

  // Size configurations
  const sizeConfig = {
    sm: { container: 'w-16 h-16', icon: 'w-5 h-5', text: 'text-xs' },
    md: { container: 'w-32 h-32', icon: 'w-8 h-8', text: 'text-sm' },
    lg: { container: 'w-40 h-40', icon: 'w-10 h-10', text: 'text-base' },
    xl: { container: 'w-48 h-48', icon: 'w-12 h-12', text: 'text-lg' }
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadFile(file)
    }
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    setImageLoadError(false)
    clearMessages()
    onImageChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    if (!disabled && !isUploading) {
      triggerFileInput()
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (disabled || isUploading) return

    const files = Array.from(e.dataTransfer.files)
    const imageFile = files.find(file => file.type.startsWith('image/'))
    
    if (imageFile) {
      uploadFile(imageFile)
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          ${sizeConfig[size].container}
          relative rounded-full border border-gray-300
          flex items-center justify-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${disabled || isUploading 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:border-blue-400 hover:bg-blue-50'
          }
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Image Display */}
        {previewUrl && showPreview && !imageLoadError ? (
          <div className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center">
            {/* Simple Image Display - Using Next.js Image component */}
            <Image
              src={previewUrl}
              alt="Company Logo"
              fill
              style={{
                objectFit: 'contain'
              }}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onLoad={() => {
                console.log('✅ Company logo loaded successfully:', previewUrl);
                setImageLoadError(false);
              }}
              onError={(e) => {
                console.error('❌ Failed to load company logo:', previewUrl, e);
                setImageLoadError(true);
              }}
            />
            
            {/* Hover Overlay - No background, just icon */}
            {!disabled && !isUploading && (
              <div className="absolute inset-0 bg-transparent transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black bg-opacity-50 rounded-full p-2">
                  <CameraIcon className="w-5 h-5 text-white" />
                </div>
              </div>
            )}
            
            {/* Upload Progress */}
            {isUploading && showProgress && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center text-white">
                  <CloudArrowUpIcon className="w-6 h-6 mx-auto mb-2 animate-bounce" />
                  <div className="text-xs">{uploadProgress}%</div>
                </div>
              </div>
            )}
            
            {/* Remove Button */}
            {!disabled && !isUploading && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveImage()
                }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 hover:opacity-100"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          /* Upload Placeholder or Error State */
          <div className="flex flex-col items-center justify-center text-gray-400">
            {imageLoadError ? (
              <div className="text-center">
                <ExclamationTriangleIcon className={`${sizeConfig[size].icon} text-red-500 mx-auto mb-1`} />
                <div className={`${sizeConfig[size].text} text-red-500`}>
                  Load Error
                </div>
              </div>
            ) : isUploading ? (
              <div className="text-center">
                <CloudArrowUpIcon className={`${sizeConfig[size].icon} animate-bounce mx-auto mb-1`} />
                {showProgress && (
                  <div className={`${sizeConfig[size].text} text-blue-600`}>
                    {uploadProgress}%
                  </div>
                )}
              </div>
            ) : (
              <>
                <CameraIcon className={sizeConfig[size].icon} />
                <span className={`${sizeConfig[size].text} mt-1 text-center`}>
                  {placeholder}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={config.acceptedFormats?.join(',') || 'image/jpeg,image/jpg,image/png,image/webp'}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {/* Messages */}
      {error && (
        <div className="mt-2 flex items-center text-red-600 text-xs animate-fade-in">
          <ExclamationTriangleIcon className="w-4 h-4 mr-1 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="mt-2 flex items-center text-green-600 text-xs animate-fade-in">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{success}</span>
        </div>
      )}
    </div>
  )
}

export default GlobalImageUpload