declare module "expo-barcode-scanner" {
  import type { ComponentType } from "react";

  export type BarCodeScannerResult = {
    type: string;
    data: string;
    bounds?: unknown;
  };

  export type PermissionStatus = "undetermined" | "granted" | "denied";

  export type PermissionResponse = {
    status: PermissionStatus;
    granted: boolean;
    canAskAgain: boolean;
    expires: "never" | number;
  };

  export interface BarCodeScannerProps {
    onBarCodeScanned?: (event: BarCodeScannerResult) => void;
    type?: string;
    barCodeTypes?: readonly string[];
    style?: unknown;
  }

  export interface BarCodeScannerModule {
    BarCodeScanner: ComponentType<BarCodeScannerProps>;
    getPermissionsAsync?: () => Promise<PermissionResponse>;
    requestPermissionsAsync: () => Promise<PermissionResponse>;
  }

  export const BarCodeScanner: ComponentType<BarCodeScannerProps>;
  export function getPermissionsAsync(): Promise<PermissionResponse>;
  export function requestPermissionsAsync(): Promise<PermissionResponse>;
  export const Constants: Record<string, unknown>;
}
