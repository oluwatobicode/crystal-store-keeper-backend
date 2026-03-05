import { NextFunction, Request, Response } from "express";

export const createSale = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;
  } catch (error) {
    console.log(error);
  }
};

export const getSales = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;
  } catch (error) {
    console.log(error);
  }
};

export const getSale = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;
  } catch (error) {
    console.log(error);
  }
};

export const getSaleInvoice = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const businessId = req.businessId!;
  } catch (error) {
    console.log(error);
  }
};
