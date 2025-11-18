import Joi from "joi";

export function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      stripUnknown: true,
      abortEarly: false,
    });
    if (error)
      return res
        .status(400)
        .json({ error: error.details.map((d) => d.message) });
    req.body = value;
    next();
  };
}

export const schemas = {
  authRegister: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),
  authLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
  productCreate: Joi.object({
    title: Joi.string().required(),
    slug: Joi.string().required(),
    sku: Joi.string().optional(),
    brand: Joi.string().optional(),
    description: Joi.string().optional(),
    variants: Joi.array()
      .items(
        Joi.object({
          variantId: Joi.string().optional(),
          name: Joi.string().optional(),
          sku: Joi.string().optional(),
          mrp: Joi.number().optional(),
          price: Joi.number().optional(),
          stock: Joi.number().optional(),
        })
      )
      .optional(),
  }),
  couponCreate: Joi.object({
    code: Joi.string().uppercase().required(),
    type: Joi.string().valid("percentage", "flat").required(),
    // If percentage, enforce 0-100. If flat, value must be >= 0.
    value: Joi.when("type", {
      is: "percentage",
      then: Joi.number().min(0).max(100).required(),
      otherwise: Joi.number().min(0).required(),
    }),
    appliesTo: Joi.object().optional(),
    usageLimit: Joi.number().optional(),
    perUserLimit: Joi.number().optional(),
    validFrom: Joi.date().optional(),
    validUntil: Joi.date().optional(),
    active: Joi.boolean().default(true),
  }),
  cartUpdate: Joi.object({
    productId: Joi.string().required(),
    variantId: Joi.string().optional(),
    qty: Joi.number().min(1).required(),
    price: Joi.number().required(),
  }),
  checkout: Joi.object({
    cartId: Joi.string().optional(),
    items: Joi.array()
      .items(
        Joi.object({
          productId: Joi.string().required(),
          variantId: Joi.string().optional(),
          qty: Joi.number().min(1).required(),
          price: Joi.number().required(),
        })
      )
      .required(),
    shipping: Joi.object().optional(),
    couponCode: Joi.string().optional(),
    paymentMethod: Joi.string().required(),
  }),
};
