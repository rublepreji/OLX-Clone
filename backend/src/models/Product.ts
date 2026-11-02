import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
    title:{
        type: String,
        required: true,
        trim:true
    },
    description:{
        type:String,
        required:true,
        minlength:10
    },
    price:{
        type:Number,
        required:true,
        min:0.01
    },
    category:{
        type:String,
        required:true,
        trim:true
    },
    imageUrl:{
        type:String,
        required:true
    },
    seller:{
        type:mongoose.Types.ObjectId,
        ref:'User',
        required:true
    },
    isSolid:{
        type:Boolean,
        default:false
    }
},{timestamps:true})

export default mongoose.model('Product',productSchema);
