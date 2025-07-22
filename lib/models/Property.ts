import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
    address: string;
}

const PropertySchema: Schema = new Schema({
    address: { type: String, required: true, trim: true }
});

PropertySchema.index({ address: 1 }, { unique: true });

export default mongoose.models.Property || mongoose.model<IProperty>('Property', PropertySchema); 