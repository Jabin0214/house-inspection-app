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

// PropertySchema.index({ Property: 1 }, { unique: true }); // 已移除，避免重复索引

export default mongoose.models.Property ||
    mongoose.model<IProperty>('Property', PropertySchema); 