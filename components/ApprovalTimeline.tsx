
import React, { useMemo, useRef, useState } from 'react';
import type { Project } from '../types.ts';
import { toPng } from 'html-to-image';
import { DownloadIcon } from './Icons.tsx';

// Hàm hỗ trợ chuyển đổi chuỗi 'DD/MM/YYYY' thành đối tượng Date, quan trọng cho tính toán.
// FIX: Chuyển đổi sang UTC để tránh lỗi múi giờ.
const parseDate = (dateStr: string | undefined): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return isNaN(date.getTime()) ? null : date;
};

// Hàm hỗ trợ tính toán chênh lệch số ngày giữa hai ngày.
const diffDays = (start: Date, end: Date): number => {
  const difference = end.getTime() - start.getTime();
  return Math.round(difference / (1000 * 60 * 60 * 24));
};

// Hàm hỗ trợ mới để định dạng các nhãn dài bằng cách chia chúng thành hai dòng.
const renderLabel = (label: string) => {
    // Xử lý các nhãn có dấu ngoặc đơn trước vì chúng có định dạng cụ thể.
    if (label.includes('(')) {
        const parts = label.split('(');
        return (
            <>
                {parts[0].trim()}
                <br />
                {`(${parts[1]}`}
            </>
        );
    }
    // Đối với các nhãn khác, chia ở dấu cách đầu tiên để tạo hai dòng.
    const firstSpaceIndex = label.indexOf(' ');
    if (firstSpaceIndex > 0 && firstSpaceIndex < label.length - 1) {
        return (
            <>
                {label.substring(0, firstSpaceIndex)}
                <br />
                {label.substring(firstSpaceIndex + 1)}
            </>
        );
    }
    // Trả về nhãn nguyên bản nếu không đáp ứng các tiêu chí.
    return label;
};


// Định nghĩa cấu trúc cho một điểm trên dòng thời gian (một chấm và một thẻ).
interface EventPoint {
  label: string;
  dateStr: string;
  position: number;
  level: number; // 1: Trên trong, 2: Trên ngoài, 3: Dưới trong, 4: Dưới ngoài
  color: string;
}

// Định nghĩa một đoạn đường kẻ mỏng biểu thị thời gian của một công việc.
interface TaskConnectingLine {
  left: number;
  width: number;
  color: string;
  level: number;
}

// Định nghĩa nhãn cho văn bản thời gian được đặt trên đường nối.
interface DurationLabel {
  text: string;
  left: number;
  width: number;
  level: number; // 1 cho phía trên, 3 cho phía dưới
  color: string;
}

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

// Hàm hỗ trợ để lấy các lớp Tailwind cho việc định vị nhãn dựa trên cấp độ của chúng.
const getLabelPositionClass = (level: number) => {
    switch (level) {
        case 1: return 'bottom-6';  // Trên, trong
        case 2: return 'bottom-24'; // Trên, ngoài
        case 3: return 'top-6';     // Dưới, trong
        case 4: return 'top-24';    // Dưới, ngoài
        default: return 'bottom-6';
    }
};

// Hàm hỗ trợ để lấy các lớp Tailwind cho việc định vị các đường nối.
const getLinePositionClass = (level: number) => {
    switch (level) {
        case 1: return 'top-[calc(50%_-_6px)]';
        case 2: return 'top-[calc(50%_-_12px)]';
        case 3: return 'top-[calc(50%_+_5px)]';
        case 4: return 'top-[calc(50%_+_11px)]';
        default: return '';
    }
};

// Hàm hỗ trợ để lấy các lớp Tailwind cho việc định vị các nhãn thời gian trên các đường nối.
const getDurationLabelPositionClass = (level: number) => {
    switch (level) {
        // Vị trí cho nhãn thời gian phía trên.
        case 1: return 'top-[calc(50%_-_26px)]';
        // Vị trí cho nhãn thời gian phía dưới, được điều chỉnh để tránh chồng chéo.
        case 3: return 'top-[calc(50%_+_14px)]';
        default: return '';
    }
};


const ApprovalTimeline: React.FC<{ project: Project }> = ({ project }) => {
    const exportRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    const handleExportImage = async () => {
        if (!exportRef.current) return;

        setIsExporting(true);
        try {
            const dataUrl = await toPng(exportRef.current, { 
                quality: 1.0, 
                pixelRatio: 3, // Higher pixel ratio for better quality
                backgroundColor: '#FFFFFF' // Set a solid background to avoid transparency
            });

            const link = document.createElement('a');
            link.download = `timeline-${project.name.replace(/ /g, '_')}.png`;
            link.href = dataUrl;
            link.click();

        } catch (error) {
            console.error('Lỗi khi xuất hình ảnh!', error);
        } finally {
            setIsExporting(false);
        }
    };

    const { taskConnectingLines, eventPoints, durationLabels, todayMarkerPosition, formattedTodayForMarker, show } = useMemo(() => {
        const singleEvents = [
            { label: "Giao dự án", dateStr: project.capitalPlanApproval?.date, color: 'cyan' },
        ];

        const taskDefinitions = [
            { name: 'Tư vấn Thiết kế', startLabel: 'E-HSMT (TVTK)', endLabel: 'Ký HĐ (TVTK)', startDateStr: project.designBidding?.itbIssuanceDate, endDateStr: project.designBidding?.contractSignDate, color: 'purple' },
            { name: 'Phương án Kỹ thuật', startLabel: 'Nộp PAKT', endLabel: 'Duyệt PAKT', startDateStr: project.technicalPlanStage?.submissionDate, endDateStr: project.technicalPlanStage?.approvalDate, color: 'red' },
            { name: 'Dự toán', startLabel: 'Nộp DT', endLabel: 'Duyệt DT', startDateStr: project.budgetStage?.submissionDate, endDateStr: project.budgetStage?.approvalDate, color: 'blue' },
            { name: 'Giám sát Thi công', startLabel: 'E-HSMT (GS)', endLabel: 'Ký HĐ (GS)', startDateStr: project.supervisionBidding?.itbIssuanceDate, endDateStr: project.supervisionBidding?.contractSignDate, color: 'pink' },
            { name: 'Thi công Sửa chữa', startLabel: 'E-HSMT (TCSC)', endLabel: 'Ký HĐ (TCSC)', startDateStr: project.constructionBidding?.itbIssuanceDate, endDateStr: project.constructionBidding?.contractSignDate, color: 'orange' },
            { name: 'Thi công', startLabel: 'Khởi công', endLabel: 'Nghiệm thu', startDateStr: project.constructionStartDate, endDateStr: project.plannedAcceptanceDate, color: 'dark-blue' },
            { name: 'Quyết toán', startLabel: 'Nộp QT', endLabel: 'Duyệt QT', startDateStr: project.finalSettlementStage?.submissionDate, endDateStr: project.finalSettlementStage?.approvalDate, color: 'blue' },
        ];
        
        const allTasksRaw = [
            ...taskDefinitions.map(t => ({...t, isSingleEvent: false })),
            ...singleEvents.map(e => ({
                name: e.label,
                startLabel: e.label,
                endLabel: e.label,
                startDateStr: e.dateStr,
                endDateStr: e.dateStr,
                color: e.color,
                isSingleEvent: true,
            }))
        ];

        const validTasks = allTasksRaw
            .map(t => ({ ...t, startDate: parseDate(t.startDateStr), endDate: parseDate(t.endDateStr) }))
            .filter(t => t.startDate); // Only need startDate to be valid now

        if (validTasks.length === 0) return { show: false, taskConnectingLines: [], eventPoints: [], todayMarkerPosition: null, durationLabels: [], formattedTodayForMarker: '' };

        const allEvents: { label: string, date: Date, dateStr: string, color: string, isStart: boolean, taskName: string }[] = [];
        validTasks.forEach(task => {
             if(task.startDate){
                allEvents.push({
                    label: task.startLabel,
                    date: task.startDate,
                    dateStr: task.startDateStr!,
                    color: task.color,
                    isStart: true,
                    taskName: task.name
                });
             }

            if (!task.isSingleEvent && task.endDate) {
                allEvents.push({
                    label: task.endLabel,
                    date: task.endDate,
                    dateStr: task.endDateStr!,
                    color: task.color,
                    isStart: false,
                    taskName: task.name
                });
            }
        });
        
        if (allEvents.length < 1) return { show: false, taskConnectingLines: [], eventPoints: [], todayMarkerPosition: null, durationLabels: [], formattedTodayForMarker: '' };

        allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

        const timelineStart = allEvents[0].date;
        let timelineEnd = allEvents[allEvents.length - 1].date;
        
        if (timelineStart.getTime() === timelineEnd.getTime()) {
            timelineEnd = new Date(timelineEnd);
            timelineEnd.setDate(timelineEnd.getDate() + 1);
        }
        
        const totalDuration = diffDays(timelineStart, timelineEnd);
        if (totalDuration <= 0) return { show: false, taskConnectingLines: [], eventPoints: [], todayMarkerPosition: null, durationLabels: [], formattedTodayForMarker: '' };

        const HORIZONTAL_MARGIN_PERCENT = 2;
        const CONTENT_WIDTH_PERCENT = 100 - (HORIZONTAL_MARGIN_PERCENT * 2);
        const scalePosition = (positionPercent: number) => HORIZONTAL_MARGIN_PERCENT + (positionPercent / 100) * CONTENT_WIDTH_PERCENT;
        
        // ** Logic Sắp xếp Vị trí **
        // Thuật toán này đặt các sự kiện trên 4 cấp độ (2 trên, 2 dưới) để tránh chồng chéo.
        // Nó luôn ưu tiên các cấp độ bên trong (gần trục thời gian hơn) trước.
        const lastEndPosition: { [level: number]: number } = { 1: -Infinity, 2: -Infinity, 3: -Infinity, 4: -Infinity };
        const LABEL_WIDTH_PERCENT = 9; // Chiều rộng ước tính của một nhãn là 9% tổng chiều rộng.
        const LABEL_MARGIN_PERCENT = 1; // Thêm một khoảng đệm 1% giữa các nhãn.

        const findAvailableLevel = (position: number, preferredLevels: number[]): number => {
            const labelHalfWidth = LABEL_WIDTH_PERCENT / 2;
            for (const level of preferredLevels) {
                // Kiểm tra xem vị trí bắt đầu của nhãn mới có nằm sau vị trí kết thúc của nhãn cuối cùng trên cấp độ này không.
                if ((position - labelHalfWidth) >= (lastEndPosition[level] + LABEL_MARGIN_PERCENT)) {
                    return level; // Cấp độ này có sẵn.
                }
            }
            // Nếu tất cả các cấp độ ưu tiên đều bị chiếm, trả về cấp độ cuối cùng trong danh sách (thường là cấp độ ngoài cùng).
            return preferredLevels[preferredLevels.length - 1];
        };

        const taskLevels = new Map<string, number>();
        const finalEventPoints: EventPoint[] = [];
        const preferredOrder = [1, 3, 2, 4]; // Luôn ưu tiên: trên-trong, dưới-trong, trên-ngoài, dưới-ngoài.

        allEvents.forEach((event) => {
            const position = scalePosition(diffDays(timelineStart, event.date) / totalDuration * 100);
            const labelHalfWidth = LABEL_WIDTH_PERCENT / 2;
            let level: number;

            const getFormattedDate = (date: Date, dateStr: string): string => {
                if (date.getTime() === timelineStart.getTime()) return dateStr;
                // Chỉ hiển thị DD/MM cho các ngày ở giữa để tiết kiệm không gian.
                return dateStr.substring(0, 5);
            };

            if (event.isStart) {
                // Đối với một sự kiện bắt đầu, tìm một cấp độ mới có sẵn.
                level = findAvailableLevel(position, preferredOrder);
                taskLevels.set(event.taskName, level);
            } else {
                // Đối với một sự kiện kết thúc, sử dụng cùng cấp độ với sự kiện bắt đầu của nó.
                level = taskLevels.get(event.taskName) || findAvailableLevel(position, preferredOrder);
            }

            finalEventPoints.push({
                label: event.label,
                dateStr: getFormattedDate(event.date, event.dateStr),
                position: position,
                level: level,
                color: event.color,
            });

            // Cập nhật vị trí kết thúc cuối cùng cho cấp độ đã chọn.
            lastEndPosition[level] = Math.max(lastEndPosition[level], position + labelHalfWidth);
        });

        const finalTaskConnectingLines: TaskConnectingLine[] = [];
        const finalDurationLabels: DurationLabel[] = [];
        validTasks.forEach(task => {
            if (task.isSingleEvent || !task.startDate || !task.endDate) return;

            const startPos = scalePosition(diffDays(timelineStart, task.startDate) / totalDuration * 100);
            const endPos = scalePosition(diffDays(timelineStart, task.endDate) / totalDuration * 100);
            const taskLevel = taskLevels.get(task.name);

            if (taskLevel && startPos < endPos) {
                finalTaskConnectingLines.push({
                    left: startPos,
                    width: endPos - startPos,
                    color: colorMap[task.color].bg,
                    level: taskLevel,
                });

                const duration = diffDays(task.startDate, task.endDate);
                if (duration > 0) {
                    finalDurationLabels.push({
                        text: `(${duration} ngày)`,
                        left: startPos,
                        width: endPos - startPos,
                        level: taskLevel <= 2 ? 1 : 3,
                        color: colorMap[task.color].text,
                    });
                }
            }
        });
        
        const now = new Date();
        // FIX: Sử dụng UTC cho ngày hôm nay để đảm bảo tính toán nhất quán.
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        let todayMarkerPosition: number | null = null;
        if (today >= timelineStart && today <= timelineEnd) {
            const todayPosRaw = diffDays(timelineStart, today) / totalDuration * 100;
            todayMarkerPosition = scalePosition(todayPosRaw);
        }
        
        // FIX: Định dạng ngày hôm nay từ đối tượng `today` (UTC) thay vì `now` (local).
        const formattedTodayForMarker = `${String(today.getUTCDate()).padStart(2, '0')}/${String(today.getUTCMonth() + 1).padStart(2, '0')}`;

        return { taskConnectingLines: finalTaskConnectingLines, eventPoints: finalEventPoints, durationLabels: finalDurationLabels, todayMarkerPosition, formattedTodayForMarker, show: true };

    }, [project]);

    if (!show) {
        return (
            <div className="bg-base-100 rounded-lg shadow-md p-6 border border-gray-200 mb-6 text-center text-gray-500">
                Chưa có đủ dữ liệu mốc thời gian để hiển thị dòng thời gian.
            </div>
        );
    }
    
  return (
    <div className="mb-6 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-primary">Dòng thời gian tổng thể</h3>
            <button
                onClick={handleExportImage}
                disabled={isExporting}
                className="flex items-center gap-2 bg-secondary text-white font-bold py-2 px-4 rounded-md hover:opacity-90 transition-opacity disabled:bg-gray-400 disabled:cursor-wait"
            >
                <DownloadIcon className="h-5 w-5" />
                {isExporting ? 'Đang xuất...' : 'Xuất hình ảnh'}
            </button>
        </div>
        <div ref={exportRef} className="overflow-x-auto bg-white p-4 rounded-lg shadow-inner border">
            <div className="relative w-full min-w-[1200px] h-64 mt-16 mb-10">
                {/* Trục chính */}
                <div className="absolute top-1/2 -translate-y-1/2 w-full h-1.5 bg-green-500 rounded-full" />
                
                {/* Các đường nối mỏng cho mỗi công việc */}
                {taskConnectingLines.map((line, i) => (
                    <div
                        key={`line-${i}`}
                        className={`absolute h-0.5 rounded-full ${line.color} ${getLinePositionClass(line.level)}`}
                        style={{ left: `${line.left}%`, width: `${line.width}%` }}
                    />
                ))}

                {/* Nhãn Thời gian */}
                {durationLabels.map((label, i) => (
                    <div
                        key={`duration-${i}`}
                        className={`absolute flex items-center justify-center text-xs font-semibold italic ${label.color} ${getDurationLabelPositionClass(label.level)}`}
                        style={{ left: `${label.left}%`, width: `${label.width}%` }}
                    >
                        <span>{label.text}</span>
                    </div>
                ))}

                {/* Các Điểm Sự kiện (Chấm và Thẻ) */}
                {eventPoints.map((point, i) => (
                    <div key={i} className="absolute top-1/2" style={{ left: `${point.position}%` }}>
                        <div className={`absolute -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white ${colorMap[point.color].border} border-2 z-20`} />
                        <div className={`absolute -translate-x-1/2 w-max text-center transition-all duration-300 ${getLabelPositionClass(point.level)}`}>
                            <div className="inline-block px-1 py-0.5 bg-white rounded-md shadow border text-xs text-center">

                                <p className={`font-bold ${colorMap[point.color].text} leading-tight`}>
                                    {renderLabel(point.label)}
                                </p>
                                <p className="text-gray-600 mt-1">{point.dateStr}</p>
                            </div>
                        </div>
                    </div>
                ))}
                
                {/* Đánh dấu Hôm nay */}
                {todayMarkerPosition !== null && (
                    <div className="absolute top-[-24px] h-[calc(100%+48px)] z-10" style={{ left: `${todayMarkerPosition}%` }}>
                        <div className="w-px h-full bg-red-500" />
                        <div className="absolute top-0 -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-md shadow-lg whitespace-nowrap">
                            {formattedTodayForMarker}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default ApprovalTimeline;
