import { InspectionTask } from './models/InspectionTask';

// 获取英文检查类型名称
export function getInspectionTypeText(type: string) {
    const typeMap = {
        'routine': 'routine inspection',
        'move-in': 'move-in inspection',
        'move-out': 'move-out inspection'
    };
    return typeMap[type as keyof typeof typeMap] || type;
}

// 获取中文检查类型名称（用于界面显示）
export function getInspectionTypeDisplayText(type: string) {
    const typeMap = {
        'routine': '常规检查',
        'move-in': '入住检查',
        'move-out': '退房检查'
    };
    return typeMap[type as keyof typeof typeMap] || type;
} 