import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
    Property: string;
}

const PropertySchema: Schema = new Schema({
    Property: {
        type: String,
        required: true,
        trim: true,
        unique: true
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc: any, ret: any) {
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

export const PropertyModel = mongoose.models.Property ||
    mongoose.model<IProperty>('Property', PropertySchema);

// 为了向后兼容，添加默认导出
export default PropertyModel; 