'use client';

import { useState } from 'react';
import { PlaceType } from '@/types';

interface PlaceFormProps {
  latitude: number;
  longitude: number;
  initialAddress?: string;
  initialName?: string;
  onSubmit: (data: PlaceFormData) => Promise<void>;
  onClose: () => void;
}

export interface PlaceFormData {
  name: string;
  type: PlaceType;
  address: string;
  latitude: number;
  longitude: number;
  description?: string;
  grade?: number;
}

export default function PlaceForm({ latitude, longitude, initialAddress, initialName, onSubmit, onClose }: PlaceFormProps) {
  const [name, setName] = useState(initialName || '');
  const [type, setType] = useState<PlaceType>('RESTAURANT');
  const [address, setAddress] = useState(initialAddress || '');
  const [description, setDescription] = useState('');
  const [grade, setGrade] = useState<number>(3);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        type,
        address: address.trim(),
        latitude,
        longitude,
        description: description.trim() || undefined,
        grade: type === 'RESTAURANT' ? grade : undefined,
      });
      onClose();
    } catch (err) {
      console.error('Failed to create place:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-80 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">장소 추가</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">유형</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('RESTAURANT')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  type === 'RESTAURANT'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                맛집
              </button>
              <button
                type="button"
                onClick={() => setType('ATTRACTION')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  type === 'ATTRACTION'
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                명소
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="장소 이름"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주소 *</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="주소를 입력하세요"
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Grade (only for restaurants) */}
          {type === 'RESTAURANT' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">등급</label>
              <div className="flex gap-2">
                {[1, 2, 3].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      grade === g
                        ? g === 1
                          ? 'bg-red-500 text-white'
                          : g === 2
                          ? 'bg-yellow-500 text-white'
                          : 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {g === 1 ? '1등급' : g === 2 ? '2등급' : '3등급'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="간단한 설명 (선택)"
              rows={2}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Coordinates */}
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            좌표: {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !address.trim()}
            className="w-full py-2.5 bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? '저장 중...' : '저장'}
          </button>
        </form>
      </div>
    </div>
  );
}
