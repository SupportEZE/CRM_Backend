import { HttpStatus } from "@nestjs/common";

export class ApiRes<T> {
  statusCode: number;
  message: string;
  data: T | null;
  pagination?: any;
  error?: any;

  constructor(
    statusCode: number,
    message: string,
    data?: T | null,
    pagination?: any,
    error?: any
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data || null;
    this.pagination = pagination;
    this.error = error || null;
  }

  // Success Response
  static success<T>(message: string, data?: T): ApiRes<T> {
    return new ApiRes<T>(200, message, data);
  }

  static error<T>(statusCode: number, message: string, error?: any): ApiRes<T> {
    return new ApiRes<T>(
      statusCode,
      message,
      null,
      undefined,
      error instanceof Error ? error.message : error // Ensures correct error format
    );
  }

  // Pagination Response
  static pagination<T>(
    data: T[],
    total: number,
    page: number = 1,
    limit: number = 10
  ): ApiRes<T[]> {
    const totalPages = Math.ceil(total / limit);
    const pagination = {
      total: total,
      cur_page: page,
      limit: limit,
      total_pages: totalPages,
      next: page < totalPages,
      prev: page > 1
    };

    // Return success response with data and pagination at the same level
    return new ApiRes<T[]>(200, "Data fetched successfully", data, pagination);
  }

  static confirm<T>(statusCode: number = HttpStatus.ACCEPTED, message: string, data?: T): ApiRes<T> {
    return {
      statusCode,
      message,
      data,
    };
  }
}
