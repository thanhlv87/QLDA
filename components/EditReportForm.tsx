import React, { useState } from 'react';
import type { DailyReport } from '../types';
import { XIcon } from './Icons';

interface EditReportFormProps {
  report: DailyReport;
  onUpdateReport: (report: DailyReport) => void;
  onCancel: () => void;
}

const EditReportForm: React.FC<EditReportFormProps> = ({ report, onUpdateReport, onCancel }) => {
  const [tasks, setTasks] = useState(report.tasks);
  const [images, setImages] = useState(report.images);
  const [isProcessingImages, setIsProcessingImages] = useState(false);

  const optimizeImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1024;
                const MAX_HEIGHT = 1024;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error('Could not get canvas context'));
                }
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
                resolve(dataUrl);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      setIsProcessingImages(true);
      const files = Array.from(e.target.files);
      const optimizedImagePromises = files.map(optimizeImage);

      try {
          const optimizedImages = await Promise.all(optimizedImagePromises);
          setImages(prev => [...prev, ...optimizedImages]);
      } catch (error) {
          console.error("Error optimizing images:", error);
          alert("An error occurred while processing the images. Please try again.");
      } finally {
          setIsProcessingImages(false);
          e.target.value = '';
      }
  };

  const handleRemoveImage = (indexToRemove: number) => {
      setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tasks.trim()) {
      alert('Nội dung công việc không được để trống.');
      return;
    }
    onUpdateReport({ ...report, tasks, images });
  };

  return (
    <div className="bg-base-100 p-6 sm:p-8 rounded-lg shadow-lg border border-gray-200 animate-fade-in">
        <h2 className="text-2xl font-bold text-primary mb-2">Chỉnh sửa Báo cáo</h2>
        <p className="text-gray-600 mb-6">Ngày: {report.date}</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="reportTasks" className="block text-sm font-medium text-gray-700 mb-1">
                Nội dung công việc đã thực hiện
                </label>
                <textarea
                id="reportTasks"
                rows={5}
                value={tasks}
                onChange={(e) => setTasks(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-secondary focus:border-secondary bg-white text-gray-900"
                placeholder="Mô tả chi tiết các công việc đã làm trong ngày..."
                required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quản lý hình ảnh
                </label>
                
                {images.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-4 p-4 border rounded-md bg-gray-50">
                        {images.map((image, index) => (
                            <div key={index} className="relative group">
                                <img src={image} alt={`Preview ${index + 1}`} className="w-full h-24 object-cover rounded-md shadow-sm" />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute top-0 right-0 -mt-2 -mr-2 bg-error text-white rounded-full p-0 w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                    aria-label="Remove image"
                                >
                                    <XIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : <p className="text-sm text-gray-500 mb-4 italic">Hiện không có hình ảnh nào.</p>}
                
                <div className="flex items-center space-x-4">
                    <label htmlFor="imageUpload" className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                        <span>Thêm ảnh...</span>
                        <input id="imageUpload" name="imageUpload" type="file" className="sr-only" multiple accept="image/*" onChange={handleImageChange} />
                    </label>
                        {isProcessingImages && <div className="text-sm text-gray-500">Đang xử lý...</div>}
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t mt-8">
                <button
                    type="button"
                    onClick={onCancel}
                    className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                    Hủy
                </button>
                <button
                    type="submit"
                    disabled={isProcessingImages}
                    className="bg-success text-white font-bold py-2 px-6 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    Lưu Thay Đổi
                </button>
            </div>
        </form>
    </div>
  );
};

export default EditReportForm;