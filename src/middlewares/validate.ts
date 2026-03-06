import { Request, Response, NextFunction } from "express";
import { Schema, ValidationError } from "joi";
import { CustomError } from "./errorHandler";

export const validate = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      throw new CustomError("Validation Error", 400, "VALIDATION_ERROR");
    }

    req.body = value;
    next();
  };
};
