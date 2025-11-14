import React from 'react';
import { API_BASE_URL } from '../../config/config';

export const ApiDocumentation: React.FC = () => {
  // بناء رابط Swagger باستخدام نفس IP و Port من config
  const swaggerUrl = `${API_BASE_URL}/api-docs`;

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3 space-x-reverse">
              <span>📚</span>
              <span>وثائق API - Swagger</span>
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              توثيق تفاعلي شامل لجميع واجهات برمجة التطبيقات (API)
            </p>
          </div>
          <div className="flex items-center space-x-3 space-x-reverse">
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              v1.0
            </span>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              REST API
            </span>
          </div>
        </div>
      </div>

      {/* Swagger iframe */}
      <div className="flex-1 overflow-hidden">
        <iframe
          src={swaggerUrl}
          className="w-full h-full border-0"
          title="Swagger API Documentation"
          allow="fullscreen"
        />
      </div>
    </div>
  );
};
