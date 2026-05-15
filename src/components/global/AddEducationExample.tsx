'use client'

import React, { useState } from 'react'
import AddEducation from './AddEducation'
import { IEducation } from '../../models/Education'

/**
 * Example component showing how to use the AddEducation component
 * This can be used as a reference for integrating the component in other parts of the application
 */
const AddEducationExample: React.FC = () => {
  const [educations, setEducations] = useState<IEducation[]>([])

  const handleEducationChange = (newEducations: IEducation[]) => {
    setEducations(newEducations)
    console.log('Education records updated:', newEducations)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AddEducation Component Example</h1>
        <p className="text-gray-600">
          This is an example of how to use the AddEducation global component. 
          The component handles all CRUD operations for education records and integrates with MongoDB.
        </p>
      </div>

      {/* Basic Usage */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Usage</h2>
        <AddEducation 
          onEducationChange={handleEducationChange}
          showExisting={true}
          maxEducations={5}
        />
      </div>

      {/* Current Education Records */}
      {educations.length > 0 && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Education Records (Debug)</h3>
          <pre className="bg-white p-4 rounded border text-sm overflow-auto">
            {JSON.stringify(educations, null, 2)}
          </pre>
        </div>
      )}

      {/* Usage Examples */}
      <div className="mt-8 bg-blue-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Examples</h3>
        
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-900">1. Basic Integration:</h4>
            <pre className="bg-white p-3 rounded border mt-2 overflow-x-auto">
{`import { AddEducation } from '@/components/global'

<AddEducation 
  onEducationChange={(educations) => {
    console.log('Education updated:', educations)
  }}
  showExisting={true}
  maxEducations={10}
/>`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium text-gray-900">2. Without showing existing records:</h4>
            <pre className="bg-white p-3 rounded border mt-2 overflow-x-auto">
{`<AddEducation 
  onEducationChange={handleEducationChange}
  showExisting={false}
  maxEducations={3}
/>`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium text-gray-900">3. With custom styling:</h4>
            <pre className="bg-white p-3 rounded border mt-2 overflow-x-auto">
{`<AddEducation 
  onEducationChange={handleEducationChange}
  className="custom-education-section"
  showExisting={true}
  maxEducations={5}
/>`}
            </pre>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mt-8 bg-green-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Add multiple education records with form validation</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Edit existing education records inline</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Delete education records with confirmation</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Automatic MongoDB integration via API endpoints</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Responsive design with Tailwind CSS</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Real-time form validation and error handling</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Configurable maximum number of education records</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Optional display of existing records</span>
          </li>
        </ul>
      </div>

      {/* API Endpoints */}
      <div className="mt-8 bg-yellow-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">API Endpoints</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium text-gray-900">GET /api/education</span>
            <span className="text-gray-600 ml-2">- Fetch user's education records</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">POST /api/education</span>
            <span className="text-gray-600 ml-2">- Create new education record</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">PUT /api/education/[id]</span>
            <span className="text-gray-600 ml-2">- Update existing education record</span>
          </div>
          <div>
            <span className="font-medium text-gray-900">DELETE /api/education/[id]</span>
            <span className="text-gray-600 ml-2">- Delete education record (soft delete)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddEducationExample
