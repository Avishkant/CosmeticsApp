import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

let instance = null;
if (razorpayKeyId && razorpayKeySecret) {
  instance = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
  });
}

export { instance as razorInstance, razorpayKeyId, razorpayKeySecret };
