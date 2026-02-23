import { NextFunction, Request, Response } from "express";

export const salesAnalysisReport = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { from, to } = req.query;

    const filter: Record<string, unknown> = {};

    if (from || to) {
      filter.createdAt = {} as Record<string, Date>;

      if (from) {
        (filter.createdAt as Record<string, Date>).$gte = new Date(
          from as string,
        );
      }

      if (to) {
        (filter.createdAt as Record<string, Date>).$lte = new Date(
          to as string,
        );
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export const productAnalysisReport = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { from, to } = req.query;
    const filter: Record<string, unknown> = {};

    if (from || to) {
      filter.createdAt = {} as Record<string, Date>;

      if (from) {
        (filter.createdAt as Record<string, Date>).$gte = new Date(
          from as string,
        );
      }

      if (to) {
        (filter.createdAt as Record<string, Date>).$lte = new Date(
          to as string,
        );
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export const paymentMethodReport = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { from, to } = req.query;

    const filter: Record<string, unknown> = {};

    if (from || to) {
      filter.createdAt = {} as Record<string, Date>;

      if (from) {
        (filter.createdAt as Record<string, Date>).$gte = new Date(
          from as string,
        );
      }

      if (to) {
        (filter.createdAt as Record<string, Date>).$lte = new Date(
          to as string,
        );
      }
    }
  } catch (error) {
    console.log(error);
  }
};

export const stockMovementReports = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { from, to } = req.query;
  const filter: Record<string, unknown> = {};

  if (from || to) {
    filter.createdAt = {} as Record<string, Date>;

    if (from) {
      (filter.createdAt as Record<string, Date>).$gte = new Date(
        from as string,
      );
    }

    if (to) {
      (filter.createdAt as Record<string, Date>).$lte = new Date(to as string);
    }
  }

  try {
  } catch (error) {
    console.log(error);
  }
};
