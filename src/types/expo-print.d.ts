declare module "expo-print" {
  export type PrintToFileOptions = {
    html: string;
    base64?: boolean;
  };

  export type PrintToFileResult = {
    uri: string;
    base64?: string;
    numberOfPages?: number;
  };

  export function printToFileAsync(options: PrintToFileOptions): Promise<PrintToFileResult>;
}
