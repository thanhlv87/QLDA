import React, { useMemo } from 'react';
import type { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  onSelectProject: (projectId: string) => void;
}

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
);


const ProjectCard: React.FC<ProjectCardProps> = ({ project, onSelectProject }) => {
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
        return { percentage: 0, statusText: 'Dữ liệu ngày không hợp lệ', statusColor: 'text-error' };
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

    if (today < startDate) {
        statusText = 'Chưa bắt đầu';
        percentage = 0;
    } else if (daysRemaining < 0) {
        statusText = `Quá hạn ${Math.abs(daysRemaining)} ngày`;
        statusColor = 'text-error';
    } else if (daysRemaining === 0) {
        statusText = 'Hạn chót hôm nay';
        statusColor = 'text-warning';
    } else {
        statusText = `Còn lại ${daysRemaining} ngày`;
    }

    return { percentage, statusText, statusColor };
  }, [project.constructionStartDate, project.plannedAcceptanceDate]);


  return (
    <div 
      className="bg-base-100 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 cursor-pointer overflow-hidden flex flex-col"
      onClick={() => onSelectProject(project.id)}
    >
      <div className="p-6 flex-grow">
        <h3 className="text-xl font-bold text-primary mb-3 truncate">{project.name}</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-center">
            <CalendarIcon />
            <span>Ngày bắt đầu: {project.constructionStartDate}</span>
          </div>
          <div className="flex items-center">
            <CalendarIcon />
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
                    className="bg-secondary h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${progressInfo.percentage}%` }}
                ></div>
            </div>
        </div>
      </div>
       <div className="bg-neutral px-6 py-3">
        <button 
          className="w-full text-center text-secondary font-semibold hover:text-accent transition-colors duration-200"
          onClick={(e) => {
              e.stopPropagation();
              onSelectProject(project.id);
          }}
        >
          Xem Chi Tiết →
        </button>
      </div>
    </div>
  );
};

export default ProjectCard;