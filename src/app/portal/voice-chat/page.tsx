'use client'

import { useState } from 'react'
import VoiceCommandChat from '@/components/VoiceCommandChat'

export default function VoiceChatPage() {
  const [showChat, setShowChat] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Voice Command Chat</h1>
              <p className="text-gray-600 mt-2">Recent voice interactions with HR Dashboard</p>
            </div>
            <button
              onClick={() => setShowChat(!showChat)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {showChat ? 'Hide Chat' : 'Show Chat'}
            </button>
          </div>

          {showChat && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Voice Commands</h2>
                <VoiceCommandChat className="min-h-[400px]" />
              </div>
              
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">How it works</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">User Messages (Left)</h4>
                    <p className="text-sm text-gray-600">
                      Your voice commands are transcribed and displayed on the left side with your name/initial.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">HR Dashboard Responses (Right)</h4>
                    <p className="text-sm text-gray-600">
                      HR Dashboard's responses show the action taken, status, and confirmation message.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
