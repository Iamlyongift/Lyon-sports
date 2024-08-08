import Joi from "joi";

export const RegisterSchema = Joi.object({
  username: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(6)
    .regex(/^[a-zA-Z0-9]{3,30}$/)
    .required(),
  confirm_password: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .label("confirm_password")
    .messages({ "any.only": "{{#label}} does not match" }),
  phone_number: Joi.string().required(),
  country: Joi.string().required(),
  profile_photo: Joi.string(),
});

export const LoginSchema = Joi.object({
  email: Joi.string().required(),
  password: Joi.string()
    .min(6)
    .regex(/^[a-zA-Z0-9]{3,30}$/)
    .required(),
});

export const option = {
  abortearly: false,
  errors: {
    wrap: {
      label: "",
    },
  },
};

export const adminRegistrationSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).required(),
  adminKey: Joi.string().required(),
});

export const adminLoginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
  confirmPassword: Joi.string().min(6).required(),
});

export const updateProfileSchema = Joi.object({
  username: Joi.string().min(3).max(30).optional(),
});

export const creatProductSchema = Joi.object({
  item_name: Joi.string().required(),
  category: Joi.string().required(),
  price: Joi.string().required(),
  description: Joi.string().required(),
  stock: Joi.string().required(),
  image: Joi.array().items(Joi.string()),
});

export const updateProductSchema = Joi.object({
  item_name: Joi.string().optional(),
  category: Joi.string().optional(),
  price: Joi.string().optional(),
  description: Joi.string().optional(),
  stock: Joi.string().required(),
  image: Joi.array().items(Joi.string()),
});

export const productSchema = Joi.object({
  item_name: Joi.string().min(2).max(100).required(),
  description: Joi.string().min(10).max(1000).required(),
  price: Joi.number().min(0.01).max(1000000).required(),
  stock: Joi.number().integer().min(0).required(),
  image: Joi.string().uri().required(),
});

export const orderSchema = Joi.object({
  userId: Joi.string().required(),
  items: Joi.array()
    .items(
      Joi.object({
        product: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/)
          .required(),
        quantity: Joi.number().integer().min(1).max(100).required(), // Adding a max quantity
      })
    )
    .min(1)
    .max(10)
    .required(), // Limiting the number of items in an order
  shippingAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    country: Joi.string().required(),
    zipCode: Joi.string().required(),
  }),
  email: Joi.string().email().required(),
});

export const updateOrderSchema = Joi.object({
  status: Joi.string().valid("pending", "confirmed", "dispatched", "completed"),
  paymentStatus: Joi.string().valid("pending", "paid"),
});

export const makePaymentSchema = Joi.object({
  paymentMethod: Joi.string().required(),
  paymentDetails: Joi.object({
    cardToken: Joi.string().required(),
  }).required(),
});

export const paymentDetailsSchema = Joi.object({
  cardToken: Joi.string().required(),
  idempotencyKey: Joi.string().required(),
  // Add other fields as needed
});
