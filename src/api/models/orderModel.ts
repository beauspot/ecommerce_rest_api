import mongoose, { Schema } from "mongoose";
import { OrderInterface } from "../interfaces/order_interface";

const orderSchema = new Schema<OrderInterface>(
  {
    products: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "ProductModel",
        },
        count: Number,
        color: String,
      },
    ],
    paymentIntent: {},
    orderStatus: {
      type: String,
      default: "Not Processed",
      enum: [
        "Not Processed",
        "Cash on Delivery",
        "Processing",
        "Dispatched",
        "Cancelled",
        "Delivered",
      ],
    },
    orderby: {
      type: Schema.Types.ObjectId,
      ref: "Usermodel",
    },
  },
  {
    timestamps: true,
  }
);

export const UserOrderModel = mongoose.model<OrderInterface>(
  "OrderModel",
  orderSchema
);
