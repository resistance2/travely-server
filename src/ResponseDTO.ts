export interface IResponseDTO<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export class ResponseDTO<T = unknown> implements IResponseDTO<T> {
  readonly success: boolean;
  readonly error?: string;
  readonly data?: T;

  constructor({ success, error, data }: IResponseDTO<T>) {
    this.success = success;
    this.error = error;
    this.data = data;
  }

  static success<T>(data: T): ResponseDTO<T> {
    return new ResponseDTO<T>({ success: true, data });
  }

  static fail(error: string): ResponseDTO<never> {
    return new ResponseDTO({ success: false, error });
  }
}
