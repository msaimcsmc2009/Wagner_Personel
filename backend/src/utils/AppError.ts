/**
 * Uygulama genelinde kullanılan, kasıtlı olarak taşınabilir hata tipi.
 *
 * `statusCode` ve `code` alanları API sözleşmesinin parçasıdır: istemci
 * hatayı kullanıcıya anlaşılır biçimde gösterebilmek için kullanır.
 * Frontend'de `ApiError` ile eşleşen bir gösterim vardır.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';

    // TypeScript'in Error subclass'ı doğru prototip zincirini kurmaz;
    // bu satır ES5 hedefine inildiğinde `instanceof` kontrolünü garantiler.
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.code = code;
    if (details !== undefined) {
      this.details = details;
    }
  }
}
