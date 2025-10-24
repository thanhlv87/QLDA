import React, { useMemo } from 'react';
import type { Project, User } from '../types.ts';
import { permissions } from '../services/permissions.ts';
import { CalendarIcon, TrashIcon } from './Icons.tsx';

interface ProjectCardProps {
  project: Project;
  currentUser: User | null;
  onSelectProject: (projectId: string) => void;
  onDeleteProject: (projectId: string, projectName: string) => void;
}


const ProjectCard: React.FC<ProjectCardProps> = ({ project, currentUser, onSelectProject, onDeleteProject }) => {
  const progressInfo = useMemo(() => {
    const parseDate = (dateStr: string): Date => {
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = parseDate(project.constructionStartDate);
    const endDate = parseDate(project.plannedAcceptanceDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate >= endDate) {
        return { percentage: 0, statusText: 'Dữ liệu ngày không hợp lệ', statusColor: 'text-error', progressColor: 'bg-error', borderColor: 'border-error' };
    }

    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsedDuration = today.getTime() - startDate.getTime();

    let percentage = 0;
    if (totalDuration > 0) {
        percentage = Math.round((elapsedDuration / totalDuration) * 100);
    }
    percentage = Math.max(0, Math.min(100, percentage));

    const oneDay = 1000 * 60 * 60 * 24;
    const timeDiff = endDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(timeDiff / oneDay);

    let statusText: string;
    let statusColor: string = 'text-gray-600';
    let progressColor: string = 'bg-success';
    let borderColor: string = 'border-success';

    if (today < startDate) {
        statusText = 'Chưa bắt đầu';
        percentage = 0;
        progressColor = 'bg-gray-400';
        borderColor = 'border-gray-400';
    } else if (daysRemaining < 0) {
        statusText = `Quá hạn ${Math.abs(daysRemaining)} ngày`;
        statusColor = 'text-error';
        progressColor = 'bg-error';
        borderColor = 'border-error';
    } else if (daysRemaining <= 7) {
        statusText = `Còn lại ${daysRemaining} ngày`;
        statusColor = 'text-warning';
        progressColor = 'bg-warning';
        borderColor = 'border-warning';
    } else {
        statusText = `Còn lại ${daysRemaining} ngày`;
    }

    return { percentage, statusText, statusColor, progressColor, borderColor };
  }, [project.constructionStartDate, project.plannedAcceptanceDate]);


  return (
    <div 
      className={`bg-base-100 rounded-lg shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col group relative border-l-4 ${progressInfo.borderColor}`}
      onClick={() => onSelectProject(project.id)}
    >
        {permissions.canDeleteProject(currentUser) && (
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProject(project.id, project.name);
                }}
                className="absolute top-3 right-3 bg-gray-200 text-gray-600 hover:bg-error hover:text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                aria-label={`Xóa dự án ${project.name}`}
            >
                <TrashIcon className="h-5 w-5" />
            </button>
        )}
      <div className="p-6 flex-grow">
        <h3 className="text-xl font-bold text-primary mb-3 truncate pr-8">{project.name}</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2 text-gray-500" />
            <span>Ngày bắt đầu: {project.constructionStartDate}</span>
          </div>
          <div className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2 text-gray-500" />
            <span>Nghiệm thu dự kiến: {project.plannedAcceptanceDate}</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between mb-1">
                <span className={`text-sm font-medium ${progressInfo.statusColor}`}>{progressInfo.statusText}</span>
                <span className="text-sm font-medium text-secondary">{progressInfo.percentage}%</span>
            </div>
            <div className="w-full bg-neutral rounded-full h-2.5">
                <div 
                    className={`${progressInfo.progressColor} h-2.5 rounded-full transition-all duration-500`} 
                    style={{ width: `${progressInfo.percentage}%` }}
                ></div>
            </div>
        </div>
      </div>
       <div className="bg-neutral px-6 py-3 mt-auto">
        <div
          className="w-full text-center text-secondary font-semibold group-hover:text-accent transition-colors duration-200"
        >
          Xem Chi Tiết →
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;