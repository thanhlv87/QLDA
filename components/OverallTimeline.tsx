
import React, { useMemo } from 'react';
import type { Project } from '../types.ts';

// --- Component Constants ---
const ROW_HEIGHT = 220; // Height for each project row in pixels
const Y_AXIS_WIDTH = 100; // Width for the project name column
const PIXELS_PER_DAY = 5; // Horizontal scale of the timeline
const HEADER_HEIGHT = 40; // Height of the sticky date header

// --- Date & Formatting Helpers ---
// FIX: Chuyển đổi sang UTC để tránh lỗi múi giờ.
const parseDate = (dateStr: string | undefined): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return isNaN(date.getTime()) ? null : date;
};

const diffDays = (start: Date, end: Date): number => {
  // Dates are in UTC, so this calculation is stable.
  const difference = end.getTime() - start.getTime();
  return Math.round(difference / (1000 * 60 * 60 * 24));
};

const renderLabel = (label: string) => {
    if (label.includes('(')) {
        const parts = label.split('(');
        return <>{parts[0].trim()}<br />{`(${parts[1]}`}</>;
    }
    const firstSpaceIndex = label.indexOf(' ');
    if (firstSpaceIndex > 0 && firstSpaceIndex < label.length - 1) {
        return <>{label.substring(0, firstSpaceIndex)}<br />{label.substring(firstSpaceIndex + 1)}</>;
    }
    return label;
};

const getShortProjectName = (fullName: string): string => {
    return fullName.replace('SCL kiến trúc ', '').trim();
};


// --- Styling Maps & Helpers ---
const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    green: { bg: 'bg-green-500', border: 'border-green-500', text: 'text-green-600' },
    purple: { bg: 'bg-purple-500', border: 'border-purple-500', text: 'text-purple-600' },
    red: { bg: 'bg-red-500', border: 'border-red-500', text: 'text-red-600' },
    blue: { bg: 'bg-blue-500', border: 'border-blue-500', text: 'text-blue-600' },
    orange: { bg: 'bg-orange-500', border: 'border-orange-500', text: 'text-orange-600' },
    pink: { bg: 'bg-pink-500', border: 'border-pink-500', text: 'text-pink-600' },
    cyan: { bg: 'bg-cyan-500', border: 'border-cyan-500', text: 'text-cyan-600' },
    'dark-blue': { bg: 'bg-blue-700', border: 'border-blue-700', text: 'text-blue-800' },
};

const getLabelPositionClass = (level: number) => {
    // Using explicit pixel values in Tailwind JIT classes for precise control
    switch (level) {
        case 1: return 'bottom-[24px]'; // 24px above center
        case 2: return 'bottom-[90px]'; // 90px above center
        case 3: return 'top-[24px]';    // 24px below center
        case 4: return 'top-[90px]';    // 90px below center
        default: return 'bottom-[24px]';
    }
};
const getLinePositionClass = (level: number) => {
    switch (level) {
        case 1: return 'top-[calc(50%_-_6px)]';
        case 2: return 'top-[calc(50%_-_12px)]';
        case 3: return 'top-[calc(50%_+_5px)]';
        case 4: return 'top-[calc(50%_+_11px)]';
        default: return '';
    }
};
const getDurationLabelPositionClass = (level: number) => {
    switch (level) {
        case 1: return 'top-[calc(50%_-_26px)]';
        case 3: return 'top-[calc(50%_+_14px)]';
        default: return '';
    }
};

const OverallTimeline: React.FC<{ projects: Project[]; onSelectProject: (id: string) => void }> = ({ projects, onSelectProject }) => {
    const timelineData = useMemo(() => {
        const allDates = projects.flatMap(p => [
            p.capitalPlanApproval?.date, p.technicalPlanStage?.submissionDate, p.technicalPlanStage?.approvalDate,
            p.budgetStage?.submissionDate, p.budgetStage?.approvalDate, p.designBidding?.itbIssuanceDate,
            p.designBidding?.contractSignDate, p.supervisionBidding?.itbIssuanceDate, p.supervisionBidding?.contractSignDate,
            p.constructionBidding?.itbIssuanceDate, p.constructionBidding?.contractSignDate, p.constructionStartDate,
            p.plannedAcceptanceDate, p.finalSettlementStage?.submissionDate, p.finalSettlementStage?.approvalDate,
        ]).map(parseDate).filter((d): d is Date => d !== null);

        if (allDates.length === 0) return null;

        const timelineStart = new Date(Math.min(...allDates.map(d => d.getTime())));
        const timelineEnd = new Date(Math.max(...allDates.map(d => d.getTime())));
        // Use setUTCDate for consistent date math regardless of timezone.
        timelineStart.setUTCDate(timelineStart.getUTCDate() - 30); // Add padding
        timelineEnd.setUTCDate(timelineEnd.getUTCDate() + 30);   // Add padding

        const totalDuration = diffDays(timelineStart, timelineEnd);
        if (totalDuration <= 0) return null;
        
        const timelineWidth = totalDuration * PIXELS_PER_DAY;

        const processedProjects = projects.map(project => {
            const singleEvents = [{ label: "Giao dự án", dateStr: project.capitalPlanApproval?.date, color: 'cyan' }];
            const taskDefinitions = [
                { name: 'Tư vấn Thiết kế', startLabel: 'E-HSMT (TVTK)', endLabel: 'Ký HĐ (TVTK)', startDateStr: project.designBidding?.itbIssuanceDate, endDateStr: project.designBidding?.contractSignDate, color: 'purple' },
                { name: 'Phương án Kỹ thuật', startLabel: 'Nộp PAKT', endLabel: 'Duyệt PAKT', startDateStr: project.technicalPlanStage?.submissionDate, endDateStr: project.technicalPlanStage?.approvalDate, color: 'red' },
                { name: 'Dự toán', startLabel: 'Nộp DT', endLabel: 'Duyệt DT', startDateStr: project.budgetStage?.submissionDate, endDateStr: project.budgetStage?.approvalDate, color: 'blue' },
                { name: 'Giám sát Thi công', startLabel: 'E-HSMT (GS)', endLabel: 'Ký HĐ (GS)', startDateStr: project.supervisionBidding?.itbIssuanceDate, endDateStr: project.supervisionBidding?.contractSignDate, color: 'pink' },
                { name: 'Thi công Sửa chữa', startLabel: 'E-HSMT (TCSC)', endLabel: 'Ký HĐ (TCSC)', startDateStr: project.constructionBidding?.itbIssuanceDate, endDateStr: project.constructionBidding?.contractSignDate, color: 'orange' },
                { name: 'Thi công', startLabel: 'Khởi công', endLabel: 'Nghiệm thu', startDateStr: project.constructionStartDate, endDateStr: project.plannedAcceptanceDate, color: 'dark-blue' },
                { name: 'Quyết toán', startLabel: 'Nộp QT', endLabel: 'Duyệt QT', startDateStr: project.finalSettlementStage?.submissionDate, endDateStr: project.finalSettlementStage?.approvalDate, color: 'blue' },
            ];

            const allEventsRaw = [
                ...taskDefinitions.map(t => ({...t, isSingleEvent: false })),
                ...singleEvents.map(e => ({ name: e.label, startLabel: e.label, endLabel: e.label, startDateStr: e.dateStr, endDateStr: e.dateStr, color: e.color, isSingleEvent: true }))
            ].map(t => ({ ...t, startDate: parseDate(t.startDateStr), endDate: parseDate(t.endDateStr) })).filter(t => t.startDate);

            const allProjectEvents = allEventsRaw.flatMap(task => {
                const events = [];
                if (task.startDate) events.push({ label: task.startLabel, date: task.startDate, dateStr: task.startDateStr!, color: task.color, isStart: true, taskName: task.name });
                if (!task.isSingleEvent && task.endDate) events.push({ label: task.endLabel, date: task.endDate, dateStr: task.endDateStr!, color: task.color, isStart: false, taskName: task.name });
                return events;
            }).sort((a, b) => a.date.getTime() - b.date.getTime());
            
            const lastEndPositionPx: { [level: number]: number } = { 1: -Infinity, 2: -Infinity, 3: -Infinity, 4: -Infinity };
            const LABEL_WIDTH_PX = 100;
            const LABEL_MARGIN_PX = 10;
            const taskLevels = new Map<string, number>();

            const eventPoints = allProjectEvents.map(event => {
                const positionPx = diffDays(timelineStart, event.date) * PIXELS_PER_DAY;
                let level;
                if (event.isStart) {
                    const preferredLevels = [1, 3, 2, 4];
                    level = preferredLevels.find(l => (positionPx - LABEL_WIDTH_PX / 2) >= (lastEndPositionPx[l] + LABEL_MARGIN_PX)) || preferredLevels[preferredLevels.length - 1];
                    taskLevels.set(event.taskName, level);
                } else {
                    level = taskLevels.get(event.taskName) || 1;
                }
                lastEndPositionPx[level] = Math.max(lastEndPositionPx[level], positionPx + LABEL_WIDTH_PX / 2);
                
                return { label: event.label, dateStr: event.dateStr.substring(0, 5), position: positionPx, level, color: event.color };
            });

            const taskConnectingLines = allEventsRaw.filter(t => !t.isSingleEvent && t.startDate && t.endDate && t.startDate < t.endDate).map(task => {
                const startPx = diffDays(timelineStart, task.startDate!) * PIXELS_PER_DAY;
                const endPx = diffDays(timelineStart, task.endDate!) * PIXELS_PER_DAY;
                const taskLevel = taskLevels.get(task.name);
                if (!taskLevel) return null;
                return { left: startPx, width: endPx - startPx, color: colorMap[task.color].bg, level: taskLevel };
            }).filter((l): l is NonNullable<typeof l> => l !== null);

            const durationLabels = allEventsRaw.filter(t => !t.isSingleEvent && t.startDate && t.endDate && t.startDate < t.endDate).map(task => {
                const duration = diffDays(task.startDate!, task.endDate!);
                if (duration <= 0) return null;
                const startPx = diffDays(timelineStart, task.startDate!) * PIXELS_PER_DAY;
                const endPx = diffDays(timelineStart, task.endDate!) * PIXELS_PER_DAY;
                const taskLevel = taskLevels.get(task.name);
                if (!taskLevel) return null;
                return { text: `(${duration} ngày)`, left: startPx, width: endPx - startPx, level: taskLevel <= 2 ? 1 : 3, color: colorMap[task.color].text };
            }).filter((l): l is NonNullable<typeof l> => l !== null);
            
            return { ...project, eventPoints, taskConnectingLines, durationLabels };
        });

        const monthMarkers = [];
        // Use Date.UTC to initialize the date iterator correctly.
        let currentMonth = new Date(Date.UTC(timelineStart.getUTCFullYear(), timelineStart.getUTCMonth(), 1));
        while (currentMonth <= timelineEnd) {
            monthMarkers.push({
                label: `T${currentMonth.getUTCMonth() + 1}/${currentMonth.getUTCFullYear()}`,
                position: diffDays(timelineStart, currentMonth) * PIXELS_PER_DAY,
            });
            currentMonth.setUTCMonth(currentMonth.getUTCMonth() + 1);
        }

        const now = new Date();
        // FIX: Sử dụng UTC cho ngày hôm nay để đảm bảo tính toán nhất quán.
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        let todayPosition = null;
        let formattedToday = null;

        if (today >= timelineStart && today <= timelineEnd) {
            todayPosition = diffDays(timelineStart, today) * PIXELS_PER_DAY;
            // FIX: Định dạng ngày hôm nay từ đối tượng `today` (UTC) thay vì `now` (local).
            formattedToday = `${String(today.getUTCDate()).padStart(2, '0')}/${String(today.getUTCMonth() + 1).padStart(2, '0')}`;
        }

        return { projects: processedProjects, todayPosition, formattedToday, monthMarkers, timelineWidth };

    }, [projects]);

    if (!timelineData) {
        return <div className="text-center text-gray-500 py-8">Vui lòng chọn ít nhất một dự án có mốc thời gian để hiển thị.</div>;
    }

    const { projects: processedProjects, todayPosition, formattedToday, monthMarkers, timelineWidth } = timelineData;
    const totalContentWidth = Y_AXIS_WIDTH + timelineWidth;

    return (
        <div className="overflow-x-auto bg-gray-50 rounded-lg shadow-inner border relative" style={{ maxHeight: '70vh' }}>
            <div style={{ width: totalContentWidth }}>
                {/* HEADER */}
                <div className="sticky top-0 z-30 bg-gray-50/80 backdrop-blur-sm" style={{ height: HEADER_HEIGHT }}>
                    <div className="absolute top-0 left-0 flex" style={{ width: totalContentWidth }}>
                        <div style={{ width: Y_AXIS_WIDTH, flexShrink: 0 }}></div>
                        <div className="relative h-full flex-grow">
                            {monthMarkers.map(marker => (
                                <div key={marker.label} className="absolute bottom-0 h-full flex flex-col justify-end" style={{ left: marker.position }}>
                                    <span className="text-xs font-semibold text-gray-500 -translate-x-1/2">{marker.label}</span>
                                    <div className="w-px h-2 bg-gray-400 mx-auto"></div>
                                </div>
                            ))}
                            {todayPosition !== null && (
                                <div className="absolute top-0 h-full z-10" style={{ left: todayPosition }}>
                                    <div className="absolute top-0 -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-b-md shadow-lg">{formattedToday}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* BODY */}
                <div className="relative">
                    <div className="absolute top-0 left-0 h-full" style={{ width: totalContentWidth }}>
                         <div className="absolute top-0 h-full" style={{ left: Y_AXIS_WIDTH, right: 0 }}>
                            {monthMarkers.map(marker => (
                                <div key={marker.label} className="absolute top-0 h-full w-px bg-gray-200" style={{ left: marker.position }}></div>
                            ))}
                            {todayPosition !== null && (
                                 <div className="absolute top-0 h-full w-0.5 bg-red-500/50 z-0" style={{ left: todayPosition }}></div>
                            )}
                         </div>
                    </div>

                    {processedProjects.map(p => (
                        <div key={p.id} className="flex border-b border-gray-200" style={{ height: ROW_HEIGHT }}>
                            <div className="sticky left-0 z-20 shrink-0 bg-white/70 backdrop-blur-sm flex items-center border-r border-gray-200" style={{ width: Y_AXIS_WIDTH }}>
                                <div className="w-full">
                                    <p 
                                      className="font-bold text-sm text-primary cursor-pointer hover:text-accent p-4" 
                                      onClick={() => onSelectProject(p.id)} 
                                      title={p.name}
                                    >
                                        {getShortProjectName(p.name)}
                                    </p>
                                </div>
                            </div>
                            <div className="relative flex-grow h-full">
                                <div className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 bg-green-500/50 rounded-full" />
                                {p.taskConnectingLines.map((line, i) => <div key={`line-${i}`} className={`absolute h-0.5 rounded-full ${line.color} ${getLinePositionClass(line.level)}`} style={{ left: line.left, width: line.width }} />)}
                                {p.durationLabels.map((label, i) => <div key={`dur-${i}`} className={`absolute flex items-center justify-center text-xs font-semibold italic ${label.color} ${getDurationLabelPositionClass(label.level)}`} style={{ left: label.left, width: label.width }}><span>{label.text}</span></div>)}
                                {p.eventPoints.map((point, i) => (
                                    <div key={`point-${i}`} className="absolute top-1/2" style={{ left: point.position }}>
                                        <div className={`absolute -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white ${colorMap[point.color].border} border-2 z-20`} />
                                        <div className={`absolute -translate-x-1/2 w-max text-center ${getLabelPositionClass(point.level)}`}>
                                            <div className="inline-block px-1 py-0.5 bg-white rounded-md shadow border text-xs text-center">
                                                <p className={`font-bold ${colorMap[point.color].text} leading-tight`}>{renderLabel(point.label)}</p>
                                                <p className="text-gray-600 mt-1">{point.dateStr}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default OverallTimeline;