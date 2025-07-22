import mongoose, { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IInspectionTask extends Document {
    id: string;
    address: string;
    inspection_type: 'routine' | 'move-in' | 'move-out';
    phone?: string;
    email?: string;
    scheduled_at?: Date;
    status: '需约时间' | '已发邮件' | '等待检查' | '完成';
    notes?: string;
}

export interface InspectionTask {
    id: string;
    address: string;
    inspection_type: 'routine' | 'move-in' | 'move-out';
    phone?: string;
    email?: string;
    scheduled_at?: string;
    status: '需约时间' | '已发邮件' | '等待检查' | '完成';
    notes?: string;
}

export type InspectionTaskInsert = Omit<InspectionTask, 'id'>;
export type InspectionTaskUpdate = Partial<InspectionTask>;

const InspectionTaskSchema: Schema = new Schema({
    id: {
        type: String,
        required: true,
        default: uuidv4
    },
    address: {
        type: String,
        required: true,
        trim: true,
        ref: 'Property',
        validate: {
            validator: async function (value: string) {
                const Property = mongoose.model('Property');
                const property = await Property.findOne({ Property: value });
                return property !== null;
            },
            message: '该地址不存在于物业列表中'
        }
    },
    inspection_type: {
        type: String,
        required: true,
        enum: ['routine', 'move-in', 'move-out']
    },
    phone: {
        type: String,
        required: false,
        trim: true,
        default: ''
    },
    email: {
        type: String,
        required: false,
        trim: true,
        lowercase: true,
        default: ''
    },
    scheduled_at: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        required: true,
        enum: ['需约时间', '已发邮件', '等待检查', '完成'],
        default: '需约时间'
    },
    notes: {
        type: String,
        required: false,
        trim: true,
        default: ''
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc: any, ret: any) {
            delete ret._id;
            delete ret.__v;
            if (ret.scheduled_at) {
                ret.scheduled_at = ret.scheduled_at.toISOString();
            }
            return ret;
        }
    }
});

InspectionTaskSchema.index({ id: 1 }, { unique: true });
InspectionTaskSchema.index({ status: 1 });
InspectionTaskSchema.index({ scheduled_at: 1 });

export const InspectionTaskModel = mongoose.models.InspectionTask ||
    mongoose.model<IInspectionTask>('InspectionTask', InspectionTaskSchema); 